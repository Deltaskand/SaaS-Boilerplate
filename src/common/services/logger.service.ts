import { Injectable, LoggerService as NestLoggerService, Scope } from '@nestjs/common';
import * as pino from 'pino';
import { ConfigService } from '@nestjs/config';

/**
 * Service de logging structuré avec Pino
 * Niveau NASA : logs JSON, corrélation IDs, anonymisation automatique
 */
@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService implements NestLoggerService {
  private logger: pino.Logger;
  private context?: string;

  constructor(private readonly configService: ConfigService) {
    const logLevel = this.configService.get<string>('logging.level', 'info');
    const prettyPrint = this.configService.get<boolean>('logging.pretty', false);

    this.logger = pino({
      level: logLevel,
      // Anonymisation automatique des champs sensibles
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'password',
          'token',
          'accessToken',
          'refreshToken',
          'secret',
          'creditCard',
          'ssn',
          'email', // Email partiel: user@***.com
        ],
        censor: '[REDACTED]',
      },
      // Format structuré pour parsing facile
      formatters: {
        level: (label): { level: string } => {
          return { level: label };
        },
        bindings: (bindings): pino.Bindings => {
          return {
            pid: bindings.pid,
            hostname: bindings.hostname,
            node_version: process.version,
          };
        },
      },
      // Pretty print en dev, JSON en prod
      transport: prettyPrint
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'SYS:standard',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
      // Timestamp ISO
      timestamp: pino.stdTimeFunctions.isoTime,
    });
  }

  /**
   * Définir le contexte (ex: UserService, AuthController)
   */
  setContext(context: string): void {
    this.context = context;
  }

  /**
   * Ajouter des métadonnées au logger (ex: correlationId, userId)
   */
  child(bindings: pino.Bindings): LoggerService {
    const childLogger = new LoggerService(this.configService);
    childLogger.logger = this.logger.child(bindings);
    childLogger.context = this.context;
    return childLogger;
  }

  /**
   * Logs de niveau trace (très détaillé)
   */
  trace(message: string, ...meta: unknown[]): void {
    this.logger.trace(this.buildMeta(meta), message);
  }

  /**
   * Logs de niveau debug
   */
  debug(message: string, ...meta: unknown[]): void {
    this.logger.debug(this.buildMeta(meta), message);
  }

  /**
   * Logs informatifs
   */
  log(message: string, ...meta: unknown[]): void {
    this.logger.info(this.buildMeta(meta), message);
  }

  /**
   * Logs d'avertissement
   */
  warn(message: string, ...meta: unknown[]): void {
    this.logger.warn(this.buildMeta(meta), message);
  }

  /**
   * Logs d'erreur
   */
  error(message: string, trace?: string, ...meta: unknown[]): void {
    this.logger.error(this.buildMeta(meta, trace), message);
  }

  /**
   * Logs critiques (fatal)
   */
  fatal(message: string, ...meta: unknown[]): void {
    this.logger.fatal(this.buildMeta(meta), message);
  }

  /**
   * Log d'audit RGPD
   */
  audit(action: string, userId: string, details: Record<string, unknown>): void {
    this.logger.info(
      {
        type: 'AUDIT',
        action,
        userId,
        timestamp: new Date().toISOString(),
        ...details,
      },
      `Audit: ${action}`,
    );
  }

  /**
   * Construire les métadonnées
   */
  private buildMeta(meta: unknown[], trace?: string): Record<string, unknown> {
    const metaObject: Record<string, unknown> = {
      context: this.context,
    };

    if (trace) {
      metaObject.trace = trace;
    }

    // Fusionner les métadonnées additionnelles
    meta.forEach((item) => {
      if (typeof item === 'object' && item !== null) {
        Object.assign(metaObject, item);
      }
    });

    return metaObject;
  }

  /**
   * Créer un logger enfant avec correlation ID
   */
  withCorrelationId(correlationId: string): LoggerService {
    return this.child({ correlationId });
  }

  /**
   * Créer un logger enfant avec user ID
   */
  withUserId(userId: string): LoggerService {
    return this.child({ userId });
  }

  /**
   * Créer un logger enfant avec request ID
   */
  withRequestId(requestId: string): LoggerService {
    return this.child({ requestId });
  }
}
