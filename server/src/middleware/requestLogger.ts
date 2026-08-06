import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

function extractErrorMessage(body: unknown): string | undefined {
  if (!body || typeof body !== 'object') return undefined;

  const record = body as Record<string, unknown>;
  const parts: string[] = [];

  if (typeof record.message === 'string' && record.message) {
    parts.push(record.message);
  }

  const error = record.error;
  if (error && typeof error === 'object') {
    const errorRecord = error as Record<string, unknown>;

    if (typeof errorRecord.message === 'string' && errorRecord.message) {
      parts.push(errorRecord.message);
    }

    if (Array.isArray(errorRecord.errors)) {
      const details = errorRecord.errors
        .map((item) => {
          if (!item || typeof item !== 'object') return null;
          const err = item as Record<string, unknown>;
          const msg = typeof err.msg === 'string' ? err.msg : null;
          if (!msg) return null;
          const path = typeof err.path === 'string' ? err.path : null;
          return path ? `${path}: ${msg}` : msg;
        })
        .filter((value): value is string => Boolean(value));

      if (details.length > 0) {
        parts.push(details.join('; '));
      }
    }
  }

  if (parts.length === 0) return undefined;
  return [...new Set(parts)].join(' — ');
}

const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  const originalJson = res.json.bind(res);

  res.json = ((body: unknown) => {
    if (res.statusCode >= 400) {
      const message = extractErrorMessage(body);
      if (message) {
        res.locals.errorMessage = message;
      }
    }
    return originalJson(body);
  }) as Response['json'];

  res.on('finish', () => {
    const duration = Date.now() - start;
    const requestId = req.id ? `[${req.id}]` : '';
    const errorMessage =
      typeof res.locals.errorMessage === 'string'
        ? ` — ${res.locals.errorMessage}`
        : '';
    const line = `${requestId} ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms${errorMessage}`;

    if (res.statusCode >= 500) {
      logger.error(line);
    } else if (res.statusCode >= 400) {
      logger.warn(line);
    } else {
      logger.info(line);
    }
  });

  next();
};

export default requestLogger;
