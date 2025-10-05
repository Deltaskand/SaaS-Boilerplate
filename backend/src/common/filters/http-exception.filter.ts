import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * HTTP Exception Response Interface
 */
interface HttpExceptionResponse {
  message: string | string[];
  error?: string;
  statusCode?: number;
}

/**
 * Global HTTP Exception Filter
 * Catches all HTTP exceptions and formats them consistently
 * Includes logging and correlation ID tracking
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // Extract correlation ID from request (added by correlation middleware)
    const correlationId = request.headers['x-correlation-id'] as string;

    // Extract message from exception response
    const getMessage = (res: string | object): string | string[] => {
      if (typeof res === 'string') return res;
      if (typeof res === 'object' && 'message' in res) {
        return (res as HttpExceptionResponse).message;
      }
      return 'Internal server error';
    };

    // Format error response
    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      correlationId,
      message: getMessage(exceptionResponse),
      ...(typeof exceptionResponse === 'object' &&
        'error' in exceptionResponse && {
          error: (exceptionResponse as HttpExceptionResponse).error,
        }),
    };

    // Log error (exclude 4xx client errors from error logs)
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `HTTP ${status} Error: ${errorResponse.message}`,
        exception.stack,
        `CorrelationID: ${correlationId}`,
      );
    } else {
      this.logger.warn(
        `HTTP ${status} Warning: ${errorResponse.message}`,
        `CorrelationID: ${correlationId}`,
      );
    }

    response.status(status).json(errorResponse);
  }
}
