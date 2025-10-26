import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  Optional,
} from '@nestjs/common';
import { Request, Response } from 'express';
import * as Sentry from '@sentry/node';
import { PinoLoggerService } from '../logger/pino-logger.service';

@Catch()
@Injectable()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger: PinoLoggerService | Logger;

  constructor(@Optional() logger?: PinoLoggerService) {
    this.logger = logger ?? new Logger(AllExceptionsFilter.name);
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException ? exception.getResponse() : 'Internal server error';

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: typeof message === 'string' ? message : (message as any).message,
    };

    this.logger.error(
      `${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : 'No stack trace',
      AllExceptionsFilter.name,
    );

    try {
      const sentryPayload =
        exception instanceof Error ? exception : new Error(this.stringifyException(exception));
      Sentry.captureException(sentryPayload);
    } catch (captureError) {
      this.logger.warn('Failed to forward exception to Sentry', AllExceptionsFilter.name);
    }

    response.status(status).json(errorResponse);
  }

  private stringifyException(exception: unknown): string {
    if (typeof exception === 'string') {
      return exception;
    }

    try {
      return JSON.stringify(exception);
    } catch (error) {
      return '[unserializable exception]';
    }
  }
}
