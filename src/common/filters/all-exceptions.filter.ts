import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from '../services/logger.service';

/**
 * Interface pour les erreurs formatées
 */
interface IErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string | string[];
  error?: string;
  correlationId?: string;
}

/**
 * Filtre d'exceptions global
 * Capture toutes les exceptions, les log de manière structurée et retourne une réponse standardisée
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {
    this.logger.setContext('ExceptionFilter');
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Déterminer le status code
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Extraire le message d'erreur
    const message = this.extractMessage(exception);
    const errorName = this.extractErrorName(exception);

    // Construire la réponse d'erreur
    const errorResponse: IErrorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      error: errorName,
      correlationId: request.correlationId,
    };

    // Logger l'erreur avec contexte complet
    this.logError(exception, request, status);

    // Envoyer la réponse
    response.status(status).json(errorResponse);
  }

  /**
   * Extraire le message d'erreur de l'exception
   */
  private extractMessage(exception: unknown): string | string[] {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'object' && 'message' in response) {
        return (response as { message: string | string[] }).message;
      }
      if (typeof response === 'string') {
        return response;
      }
    }

    if (exception instanceof Error) {
      return exception.message;
    }

    return 'Internal server error';
  }

  /**
   * Extraire le nom de l'erreur
   */
  private extractErrorName(exception: unknown): string {
    if (exception instanceof Error) {
      return exception.name;
    }
    return 'UnknownError';
  }

  /**
   * Logger l'erreur avec métadonnées complètes
   */
  private logError(exception: unknown, request: Request, status: number): void {
    const loggerWithContext = this.logger.withCorrelationId(request.correlationId || 'unknown');

    const errorMeta = {
      statusCode: status,
      method: request.method,
      url: request.url,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      userId: request['userId'],
    };

    if (status >= 500) {
      // Erreurs serveur : log avec stack trace
      const stack = exception instanceof Error ? exception.stack : undefined;
      loggerWithContext.error(`Server error: ${this.extractMessage(exception)}`, stack, errorMeta);
    } else if (status >= 400) {
      // Erreurs client : log en warning
      loggerWithContext.warn(`Client error: ${this.extractMessage(exception)}`, errorMeta);
    } else {
      // Autres : log en info
      loggerWithContext.log(`Error: ${this.extractMessage(exception)}`, errorMeta);
    }
  }
}
