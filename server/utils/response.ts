import type { ApiResponse } from '../types';

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:8787',
  'http://localhost:3000',
];

export function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin');
  const requestUrl = new URL(request.url);

  let allowedOrigin: string | null = null;

  if (origin) {
    const isAllowed =
      ALLOWED_ORIGINS.includes(origin) ||
      origin.endsWith('.pages.dev') ||
      origin.endsWith('.vercel.app') ||
      origin === requestUrl.origin;

    allowedOrigin = isAllowed ? origin : null;
  }

  const finalOrigin = allowedOrigin || ALLOWED_ORIGINS[0] || requestUrl.origin;

  return {
    'Access-Control-Allow-Origin': finalOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  };
}

export function jsonResponse<T>(
  data: ApiResponse<T>,
  request: Request,
  status: number = 200,
  extraHeaders: Record<string, string> = {}
): Response {
  const corsHeaders = getCorsHeaders(request);

  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
      ...extraHeaders,
    },
  });
}

export function errorResponse(
  request: Request,
  message: string,
  status: number = 500
): Response {
  return jsonResponse({ success: false, error: message }, request, status);
}

export function successResponse<T>(
  request: Request,
  data: T,
  message?: string,
  extraHeaders: Record<string, string> = {}
): Response {
  return jsonResponse({ success: true, data, message }, request, 200, extraHeaders);
}
