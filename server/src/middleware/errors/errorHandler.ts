import { Request, Response, NextFunction } from 'express';
import logger, { logError } from '../../config/logger';
import { HTTP_STATUS, ERROR_MESSAGES } from '../../constants/status.constants';
import { isDevelopment } from '../../constants/system.constants';
import { IAppError } from '../../types/errors.types';

const errorHandler = (
  err: IAppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): Response => {
  let statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message: string = ERROR_MESSAGES.INTERNAL_SERVER_ERROR;

  if ('statusCode' in err && err.statusCode) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof Error) {
    message = err.message;
  }

  if (statusCode === HTTP_STATUS.INTERNAL_SERVER_ERROR) {
    logError('Unhandled HTTP error', err);
  } else {
    logger.warn(`HTTP ${statusCode}: ${message}`);
  }

  return res.status(statusCode).json({
    success: false,
    error: {
      message: isDevelopment ? message : ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      ...(isDevelopment && {
        stack: err.stack,
        details: err instanceof Error ? err.message : String(err),
      }),
      ...(isDevelopment && _req.id && { requestId: _req.id }),
    },
  });
};

export default errorHandler;
