// Cloudflare Pages Functions API handler
import { createDbClient } from '../../server/db/client';
import { NavigationService } from '../../server/api/service';
import { jsonResponse, errorResponse, successResponse, getCorsHeaders } from '../../server/utils/response';
import { validateRequestBody, validateExportData, RateLimiter } from '../../server/utils/validation';
import type { LoginRequest, ExportData, GroupOrderUpdate, SiteOrderUpdate } from '../../server/types';

const loginRateLimiter = new RateLimiter(5, 15);

interface Env {
  TURSO_DATABASE_URL: string;
  TURSO_AUTH_TOKEN?: string;
  AUTH_ENABLED: string;
  AUTH_USERNAME: string;
  AUTH_PASSWORD: string;
  AUTH_SECRET: string;
  AUTH_REQUIRED_FOR_READ?: string;
}

function getClientIP(request: Request): string {
  return (
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For') ||
    'unknown'
  );
}

function getAuthToken(request: Request): string | null {
  const cookieHeader = request.headers.get('Cookie');
  
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').reduce(
      (acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        if (key && value) {
          acc[key] = value;
        }
        return acc;
      },
      {} as Record<string, string>
    );

    if (cookies['auth_token']) {
      return cookies['auth_token'];
    }
  }

  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const request = context.request;
  const env = context.env;

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: getCorsHeaders(request),
    });
  }

  try {
    const db = createDbClient(env.TURSO_DATABASE_URL, env.TURSO_AUTH_TOKEN);
    const service = new NavigationService({
      db,
      authEnabled: env.AUTH_ENABLED === 'true',
      authUsername: env.AUTH_USERNAME || '',
      authPasswordHash: env.AUTH_PASSWORD || '',
      authSecret: env.AUTH_SECRET || 'default-secret',
      authRequiredForRead: env.AUTH_REQUIRED_FOR_READ === 'true',
    });

    const url = new URL(request.url);
    // Normalize path: remove /api prefix and trailing slashes
    const path = url.pathname.replace(/^\/api\/?/, '').replace(/\/$/, '');
    const method = request.method;

    // Health check endpoint
    if (path === 'health' && method === 'GET') {
      return jsonResponse({ status: 'ok', timestamp: new Date().toISOString() }, request, 200);
    }

    // Login endpoint
    if (path === 'login' && method === 'POST') {
      const clientIP = getClientIP(request);

      if (!loginRateLimiter.check(clientIP)) {
        return jsonResponse(
          {
            success: false,
            error: 'Too many login attempts, please try again later (max 5 per 15 minutes)',
          },
          request,
          429
        );
      }

      const body = (await validateRequestBody(request)) as LoginRequest;
      const result = await service.login(body);

      if (result.success && result.token) {
        const maxAge = body.rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60;

        return jsonResponse(
          { success: true, message: result.message },
          request,
          200,
          {
            'Set-Cookie': [
              `auth_token=${result.token}`,
              'HttpOnly',
              'Secure',
              'SameSite=Strict',
              `Max-Age=${maxAge}`,
              'Path=/',
            ].join('; '),
          }
        );
      }

      return jsonResponse(result, request, result.success ? 200 : 401);
    }

    // Logout endpoint
    if (path === 'logout' && method === 'POST') {
      return jsonResponse(
        { success: true, message: 'Logged out successfully' },
        request,
        200,
        {
          'Set-Cookie': [
            'auth_token=',
            'HttpOnly',
            'Secure',
            'SameSite=Strict',
            'Max-Age=0',
            'Path=/',
          ].join('; '),
        }
      );
    }

    // Auth status endpoint
    if (path === 'auth/status' && method === 'GET') {
      const token = getAuthToken(request);

      if (token && service.isAuthEnabled()) {
        const result = await service.verifyToken(token);
        return successResponse(request, { authenticated: result.valid });
      }

      return successResponse(request, { authenticated: false });
    }

    // Verify authentication for write operations
    const token = getAuthToken(request);
    let isAuthenticated = false;

    if (token && service.isAuthEnabled()) {
      const result = await service.verifyToken(token);
      isAuthenticated = result.valid;
    } else if (!service.isAuthEnabled()) {
      isAuthenticated = true;
    }

    // Read-only routes can work without auth if AUTH_REQUIRED_FOR_READ is false
    const isReadOperation = method === 'GET';
    const requiresAuth = !isReadOperation || service.isAuthRequiredForRead();

    if (requiresAuth && !isAuthenticated) {
      return errorResponse(request, 'Unauthorized', 401);
    }

    // Groups endpoints
    if (path === 'groups' && method === 'GET') {
      const groups = await service.getGroups(isAuthenticated);
      return successResponse(request, groups);
    }

    if (path === 'groups' && method === 'POST') {
      const body = (await validateRequestBody(request)) as any;
      const group = await service.createGroup(body);
      return successResponse(request, group);
    }

    if (path.startsWith('groups/') && method === 'GET') {
      const id = parseInt(pathParts[pathParts.length - 1]!);
      const group = await service.getGroup(id, isAuthenticated);
      if (!group) {
        return errorResponse(request, 'Group not found', 404);
      }
      return successResponse(request, group);
    }

    if (path.startsWith('groups/') && method === 'PUT') {
      const id = parseInt(pathParts[pathParts.length - 1]!);
      const body = (await validateRequestBody(request)) as any;
      const group = await service.updateGroup(id, body);
      if (!group) {
        return errorResponse(request, 'Group not found', 404);
      }
      return successResponse(request, group);
    }

    if (path.startsWith('groups/') && method === 'DELETE') {
      const id = parseInt(pathParts[pathParts.length - 1]!);
      await service.deleteGroup(id);
      return successResponse(request, { deleted: true });
    }

    // Group orders endpoint
    if (path === 'group-orders' && method === 'PUT') {
      const body = (await validateRequestBody(request)) as GroupOrderUpdate[];
      await service.updateGroupOrders(body);
      return successResponse(request, { success: true });
    }

    // Sites endpoints
    if (path === 'sites' && method === 'GET') {
      const groupId = url.searchParams.get('groupId');
      const sites = await service.getSites(
        groupId ? parseInt(groupId) : undefined,
        isAuthenticated
      );
      return successResponse(request, sites);
    }

    if (path === 'sites' && method === 'POST') {
      const body = (await validateRequestBody(request)) as any;
      const site = await service.createSite(body);
      return successResponse(request, site);
    }

    if (path.startsWith('sites/') && method === 'GET') {
      const id = parseInt(pathParts[pathParts.length - 1]!);
      const site = await service.getSite(id, isAuthenticated);
      if (!site) {
        return errorResponse(request, 'Site not found', 404);
      }
      return successResponse(request, site);
    }

    if (path.startsWith('sites/') && method === 'PUT') {
      const id = parseInt(pathParts[pathParts.length - 1]!);
      const body = (await validateRequestBody(request)) as any;
      const site = await service.updateSite(id, body);
      if (!site) {
        return errorResponse(request, 'Site not found', 404);
      }
      return successResponse(request, site);
    }

    if (path.startsWith('sites/') && method === 'DELETE') {
      const id = parseInt(pathParts[pathParts.length - 1]!);
      await service.deleteSite(id);
      return successResponse(request, { deleted: true });
    }

    // Site orders endpoint
    if (path === 'site-orders' && method === 'PUT') {
      const body = (await validateRequestBody(request)) as SiteOrderUpdate[];
      await service.updateSiteOrders(body);
      return successResponse(request, { success: true });
    }

    // Groups with sites endpoint
    if (path === 'groups-with-sites' && method === 'GET') {
      const groupsWithSites = await service.getGroupsWithSites(isAuthenticated);
      return successResponse(request, groupsWithSites);
    }

    // Config endpoints
    if (path === 'configs' && method === 'GET') {
      const configs = await service.getAllConfigs();
      return successResponse(request, configs);
    }

    if (path.startsWith('configs/') && method === 'GET') {
      const key = pathParts[pathParts.length - 1]!;
      const value = await service.getConfig(key);
      return successResponse(request, { key, value });
    }

    if (path.startsWith('configs/') && method === 'PUT') {
      const key = pathParts[pathParts.length - 1]!;
      const body = (await validateRequestBody(request)) as { value: string };
      await service.setConfig(key, body.value);
      return successResponse(request, { key, value: body.value });
    }

    // Export endpoint
    if (path === 'export' && method === 'GET') {
      const data = await service.exportData();
      return successResponse(request, data);
    }

    // Import endpoint
    if (path === 'import' && method === 'POST') {
      const body = (await validateRequestBody(request)) as ExportData;
      const validation = validateExportData(body);

      if (!validation.valid) {
        return errorResponse(request, `Validation failed: ${validation.errors.join(', ')}`, 400);
      }

      const result = await service.importData(body);
      return successResponse(request, result);
    }

    return errorResponse(request, `Not found: ${path}`, 404);
  } catch (error) {
    console.error('API error:', error);
    return errorResponse(
      request,
      error instanceof Error ? error.message : 'Internal server error',
      500
    );
  }
};
