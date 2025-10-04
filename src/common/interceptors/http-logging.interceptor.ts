import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { LoggerService } from '../services/logger.service';

/**
 * Intercepteur de logging HTTP
 * Log toutes les requêtes et réponses avec métriques de performance
 */
@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {
    this.logger.setContext('HttpLogger');
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const startTime = Date.now();

    const { method, url, ip, headers } = request;

    // Logger avec correlation ID
    const loggerWithContext = this.logger
      .withCorrelationId(request.correlationId || 'unknown')
      .withUserId(request['userId'] || 'anonymous');

    // Log de la requête entrante
    loggerWithContext.log(`Incoming request: ${method} ${url}`, {
      ip,
      userAgent: headers['user-agent'],
    });

    return next.handle().pipe(
      tap({
        next: (): void => {
          const duration = Date.now() - startTime;
          const { statusCode } = response;

          // Log de la réponse
          loggerWithContext.log(`Request completed: ${method} ${url}`, {
            statusCode,
            duration: `${duration}ms`,
          });

          // Warning si la requête est lente (> 1000ms)
          if (duration > 1000) {
            loggerWithContext.warn(`Slow request detected: ${method} ${url}`, {
              duration: `${duration}ms`,
            });
          }
        },
        error: (error: Error): void => {
          const duration = Date.now() - startTime;

          loggerWithContext.error(`Request failed: ${method} ${url}`, error.stack, {
            duration: `${duration}ms`,
            error: error.message,
          });
        },
      }),
    );
  }
}
