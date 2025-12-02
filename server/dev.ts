// Local development server for API endpoints
import { createServer } from 'http';
import * as dotenv from 'dotenv';
import { createDbClient } from './db/client';
import { NavigationService } from './api/service';
import { jsonResponse, errorResponse, successResponse, getCorsHeaders } from './utils/response';
import { validateRequestBody, validateExportData, RateLimiter } from './utils/validation';
import type { LoginRequest, ExportData, GroupOrderUpdate, SiteOrderUpdate } from './types';

dotenv.config();

const PORT = 8787;
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

function getClientIP(request: any): string {
  return request.headers['x-forwarded-for'] || request.connection.remoteAddress || 'unknown';
}

function getAuthToken(request: any): string | null {
  const cookieHeader = request.headers['cookie'];

  if (cookieHeader) {
    const cookies = cookieHeader.split(';').reduce(
      (acc: Record<string, string>, cookie: string) => {
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

  const authHeader = request.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}

async function handleRequest(req: any, res: any) {
  const env: Env = {
    TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL!,
    TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN,
    AUTH_ENABLED: process.env.AUTH_ENABLED || 'true',
    AUTH_USERNAME: process.env.AUTH_USERNAME || 'admin',
    AUTH_PASSWORD: process.env.AUTH_PASSWORD || '',
    AUTH_SECRET: process.env.AUTH_SECRET || 'default-secret',
    AUTH_REQUIRED_FOR_READ: process.env.AUTH_REQUIRED_FOR_READ || 'false',
  };

  // Create a Request object compatible with the API handler
  const url = `http://localhost:${PORT}${req.url}`;
  const request = new Request(url, {
    method: req.method,
    headers: req.headers as any,
  });

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    const corsHeaders = getCorsHeaders(request);
    res.writeHead(204, corsHeaders);
    res.end();
    return;
  }

  try {
    // Read body for POST/PUT requests
    let body = '';
    if (req.method === 'POST' || req.method === 'PUT') {
      await new Promise((resolve) => {
        req.on('data', (chunk: Buffer) => {
          body += chunk.toString();
        });
        req.on('end', resolve);
      });
    }

    const db = createDbClient(env.TURSO_DATABASE_URL, env.TURSO_AUTH_TOKEN);
    const service = new NavigationService({
      db,
      authEnabled: env.AUTH_ENABLED === 'true',
      authUsername: env.AUTH_USERNAME || '',
      authPasswordHash: env.AUTH_PASSWORD || '',
      authSecret: env.AUTH_SECRET || 'default-secret',
      authRequiredForRead: env.AUTH_REQUIRED_FOR_READ === 'true',
    });

    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    const path = pathParts.slice(1).join('/'); // Remove 'api' prefix
    const method = req.method;

    let response: Response;

    // Login endpoint
    if (path === 'login' && method === 'POST') {
      const clientIP = getClientIP(req);

      if (!loginRateLimiter.check(clientIP)) {
        response = jsonResponse(
          {
            success: false,
            error: 'Too many login attempts, please try again later (max 5 per 15 minutes)',
          },
          request,
          429
        );
      } else {
        const loginData = JSON.parse(body) as LoginRequest;
        const result = await service.login(loginData);

        if (result.success && result.token) {
          const maxAge = 30 * 24 * 60 * 60;
          const cookieValue = `auth_token=${result.token}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Lax`;

          response = successResponse(request, { token: result.token }, result.message, {
            'Set-Cookie': cookieValue,
          });
        } else {
          response = errorResponse(request, result.message, 401);
        }
      }
    }
    // Logout endpoint
    else if (path === 'logout' && method === 'POST') {
      const cookieValue = 'auth_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax';
      response = successResponse(request, null, 'Logged out successfully', {
        'Set-Cookie': cookieValue,
      });
    }
    // Auth status endpoint
    else if (path === 'auth/status' && method === 'GET') {
      const token = getAuthToken(req);
      let isAuthenticated = false;

      if (token) {
        const verification = await service.verifyToken(token);
        isAuthenticated = verification.valid;
      }

      response = successResponse(request, {
        authenticated: isAuthenticated,
        authEnabled: service.isAuthEnabled(),
        authRequired: service.isAuthRequiredForRead(),
      });
    }
    // Groups endpoints
    else if (path === 'groups' && method === 'GET') {
      const token = getAuthToken(req);
      let isAuthenticated = false;

      if (token) {
        const verification = await service.verifyToken(token);
        isAuthenticated = verification.valid;
      }

      const groups = await service.getGroups(isAuthenticated);
      response = successResponse(request, groups);
    } else if (path === 'groups' && method === 'POST') {
      const token = getAuthToken(req);
      if (!token) {
        response = errorResponse(request, 'Unauthorized', 401);
      } else {
        const verification = await service.verifyToken(token);
        if (!verification.valid) {
          response = errorResponse(request, 'Unauthorized', 401);
        } else {
          const groupData = JSON.parse(body);
          const group = await service.createGroup(groupData);
          response = successResponse(request, group, 'Group created successfully');
        }
      }
    } else if (path.startsWith('groups/') && method === 'PUT') {
      const token = getAuthToken(req);
      if (!token) {
        response = errorResponse(request, 'Unauthorized', 401);
      } else {
        const verification = await service.verifyToken(token);
        if (!verification.valid) {
          response = errorResponse(request, 'Unauthorized', 401);
        } else {
          const id = parseInt(pathParts[2]);
          const updates = JSON.parse(body);
          const group = await service.updateGroup(id, updates);
          if (group) {
            response = successResponse(request, group, 'Group updated successfully');
          } else {
            response = errorResponse(request, 'Group not found', 404);
          }
        }
      }
    } else if (path.startsWith('groups/') && method === 'DELETE') {
      const token = getAuthToken(req);
      if (!token) {
        response = errorResponse(request, 'Unauthorized', 401);
      } else {
        const verification = await service.verifyToken(token);
        if (!verification.valid) {
          response = errorResponse(request, 'Unauthorized', 401);
        } else {
          const id = parseInt(pathParts[2]);
          const success = await service.deleteGroup(id);
          if (success) {
            response = successResponse(request, null, 'Group deleted successfully');
          } else {
            response = errorResponse(request, 'Group not found', 404);
          }
        }
      }
    } else if (path === 'group-orders' && method === 'PUT') {
      const token = getAuthToken(req);
      if (!token) {
        response = errorResponse(request, 'Unauthorized', 401);
      } else {
        const verification = await service.verifyToken(token);
        if (!verification.valid) {
          response = errorResponse(request, 'Unauthorized', 401);
        } else {
          const orders = JSON.parse(body) as GroupOrderUpdate[];
          await service.updateGroupOrders(orders);
          response = successResponse(request, { success: true });
        }
      }
    }
    // Sites endpoints
    else if (path === 'sites' && method === 'GET') {
      const token = getAuthToken(req);
      let isAuthenticated = false;

      if (token) {
        const verification = await service.verifyToken(token);
        isAuthenticated = verification.valid;
      }

      const groupId = urlObj.searchParams.get('groupId');
      const sites = await service.getSites(
        groupId ? parseInt(groupId) : undefined,
        isAuthenticated
      );
      response = successResponse(request, sites);
    } else if (path === 'sites' && method === 'POST') {
      const token = getAuthToken(req);
      if (!token) {
        response = errorResponse(request, 'Unauthorized', 401);
      } else {
        const verification = await service.verifyToken(token);
        if (!verification.valid) {
          response = errorResponse(request, 'Unauthorized', 401);
        } else {
          const siteData = JSON.parse(body);
          const site = await service.createSite(siteData);
          response = successResponse(request, site, 'Site created successfully');
        }
      }
    } else if (path.startsWith('sites/') && method === 'PUT') {
      const token = getAuthToken(req);
      if (!token) {
        response = errorResponse(request, 'Unauthorized', 401);
      } else {
        const verification = await service.verifyToken(token);
        if (!verification.valid) {
          response = errorResponse(request, 'Unauthorized', 401);
        } else {
          const id = parseInt(pathParts[2]);
          const updates = JSON.parse(body);
          const site = await service.updateSite(id, updates);
          if (site) {
            response = successResponse(request, site, 'Site updated successfully');
          } else {
            response = errorResponse(request, 'Site not found', 404);
          }
        }
      }
    } else if (path.startsWith('sites/') && method === 'DELETE') {
      const token = getAuthToken(req);
      if (!token) {
        response = errorResponse(request, 'Unauthorized', 401);
      } else {
        const verification = await service.verifyToken(token);
        if (!verification.valid) {
          response = errorResponse(request, 'Unauthorized', 401);
        } else {
          const id = parseInt(pathParts[2]);
          const success = await service.deleteSite(id);
          if (success) {
            response = successResponse(request, null, 'Site deleted successfully');
          } else {
            response = errorResponse(request, 'Site not found', 404);
          }
        }
      }
    } else if (path === 'site-orders' && method === 'PUT') {
      const token = getAuthToken(req);
      if (!token) {
        response = errorResponse(request, 'Unauthorized', 401);
      } else {
        const verification = await service.verifyToken(token);
        if (!verification.valid) {
          response = errorResponse(request, 'Unauthorized', 401);
        } else {
          const orders = JSON.parse(body) as SiteOrderUpdate[];
          await service.updateSiteOrders(orders);
          response = successResponse(request, { success: true });
        }
      }
    }
    // Groups with sites endpoint
    else if (path === 'groups-with-sites' && method === 'GET') {
      const token = getAuthToken(req);
      let isAuthenticated = false;

      if (token) {
        const verification = await service.verifyToken(token);
        isAuthenticated = verification.valid;
      }

      const data = await service.getGroupsWithSites(isAuthenticated);
      response = successResponse(request, data);
    }
    // Config endpoints
    else if (path === 'configs' && method === 'GET') {
      const configs = await service.getAllConfigs();
      response = successResponse(request, configs);
    } else if (path.startsWith('configs/') && method === 'GET') {
      const key = pathParts[2];
      const value = await service.getConfig(key);
      response = successResponse(request, { key, value });
    } else if (path.startsWith('configs/') && method === 'PUT') {
      const token = getAuthToken(req);
      if (!token) {
        response = errorResponse(request, 'Unauthorized', 401);
      } else {
        const verification = await service.verifyToken(token);
        if (!verification.valid) {
          response = errorResponse(request, 'Unauthorized', 401);
        } else {
          const key = pathParts[2];
          const configData = JSON.parse(body);
          await service.setConfig(key, configData.value);
          response = successResponse(request, { key, value: configData.value });
        }
      }
    }
    // Export endpoint
    else if (path === 'export' && method === 'GET') {
      const token = getAuthToken(req);
      if (!token) {
        response = errorResponse(request, 'Unauthorized', 401);
      } else {
        const verification = await service.verifyToken(token);
        if (!verification.valid) {
          response = errorResponse(request, 'Unauthorized', 401);
        } else {
          const data = await service.exportData();
          response = successResponse(request, data);
        }
      }
    }
    // Import endpoint
    else if (path === 'import' && method === 'POST') {
      const token = getAuthToken(req);
      if (!token) {
        response = errorResponse(request, 'Unauthorized', 401);
      } else {
        const verification = await service.verifyToken(token);
        if (!verification.valid) {
          response = errorResponse(request, 'Unauthorized', 401);
        } else {
          const importData = JSON.parse(body) as ExportData;
          const result = await service.importData(importData);
          if (result.success) {
            response = successResponse(request, result, 'Data imported successfully');
          } else {
            response = errorResponse(request, result.error || 'Import failed', 400);
          }
        }
      }
    } else {
      response = errorResponse(request, 'Not found', 404);
    }

    // Send response
    const responseData = await response.text();
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    res.writeHead(response.status, responseHeaders);
    res.end(responseData);
  } catch (error) {
    console.error('Server error:', error);
    const corsHeaders = getCorsHeaders(new Request(`http://localhost:${PORT}${req.url}`));
    res.writeHead(500, {
      'Content-Type': 'application/json',
      ...corsHeaders,
    });
    res.end(JSON.stringify({ success: false, error: 'Internal server error' }));
  }
}

// Check required environment variables
if (!process.env.TURSO_DATABASE_URL) {
  console.error('❌ Error: TURSO_DATABASE_URL is required in .env file');
  process.exit(1);
}

const server = createServer(handleRequest);

server.listen(PORT, () => {
  console.log(`\nTextus API Server`);
  console.log(`======================`);
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📊 Database: ${process.env.TURSO_DATABASE_URL}`);
  console.log(`🔐 Auth Enabled: ${process.env.AUTH_ENABLED || 'true'}`);
  console.log(`\n🚀 Ready to handle API requests!\n`);
});
