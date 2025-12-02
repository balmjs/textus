import type { ExportData } from '../types';

const MAX_BODY_SIZE = 1024 * 1024; // 1MB

export async function validateRequestBody(request: Request): Promise<unknown> {
  const contentLength = request.headers.get('Content-Length');

  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE) {
    throw new Error('Request body too large, maximum 1MB allowed');
  }

  const bodyText = await request.text();

  if (bodyText.length > MAX_BODY_SIZE) {
    throw new Error('Request body too large, maximum 1MB allowed');
  }

  try {
    return JSON.parse(bodyText);
  } catch {
    throw new Error('Invalid JSON format');
  }
}

export function validateExportData(data: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    errors.push('Data must be an object');
    return { valid: false, errors };
  }

  const d = data as Record<string, unknown>;

  if (!d.version || typeof d.version !== 'string') {
    errors.push('Missing or invalid version');
  }

  if (!d.exportDate || typeof d.exportDate !== 'string') {
    errors.push('Missing or invalid export date');
  }

  if (!Array.isArray(d.groups)) {
    errors.push('groups must be an array');
  } else {
    d.groups.forEach((group: unknown, index: number) => {
      if (!group || typeof group !== 'object') {
        errors.push(`groups[${index}]: must be an object`);
        return;
      }
      const g = group as Record<string, unknown>;
      if (!g.name || typeof g.name !== 'string') {
        errors.push(`groups[${index}]: name must be a string`);
      }
      if (typeof g.orderNum !== 'number') {
        errors.push(`groups[${index}]: orderNum must be a number`);
      }
    });
  }

  if (!Array.isArray(d.sites)) {
    errors.push('sites must be an array');
  } else {
    d.sites.forEach((site: unknown, index: number) => {
      if (!site || typeof site !== 'object') {
        errors.push(`sites[${index}]: must be an object`);
        return;
      }
      const s = site as Record<string, unknown>;
      if (!s.name || typeof s.name !== 'string') {
        errors.push(`sites[${index}]: name must be a string`);
      }
      if (!s.url || typeof s.url !== 'string') {
        errors.push(`sites[${index}]: url must be a string`);
      } else {
        try {
          new URL(s.url);
        } catch {
          errors.push(`sites[${index}]: invalid URL format`);
        }
      }
      if (typeof s.groupId !== 'number') {
        errors.push(`sites[${index}]: groupId must be a number`);
      }
      if (typeof s.orderNum !== 'number') {
        errors.push(`sites[${index}]: orderNum must be a number`);
      }
    });
  }

  if (!d.configs || typeof d.configs !== 'object') {
    errors.push('configs must be an object');
  }

  return { valid: errors.length === 0, errors };
}

// Simple rate limiter
export class RateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 5, windowMinutes: number = 15) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMinutes * 60 * 1000;
  }

  check(identifier: string): boolean {
    const now = Date.now();
    const record = this.requests.get(identifier);

    if (record && now > record.resetTime) {
      this.requests.delete(identifier);
    }

    const current = this.requests.get(identifier) || {
      count: 0,
      resetTime: now + this.windowMs,
    };

    if (current.count >= this.maxRequests) {
      return false;
    }

    current.count++;
    this.requests.set(identifier, current);
    return true;
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.requests.entries()) {
      if (now > record.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}
