import { Injectable, LoggerService } from '@nestjs/common';
import { Logger as PinoInstance, Bindings } from 'pino';
import { ConfigService } from '../../config/config.service';
import { createPinoLogger } from '../logger.config';

/**
 * NestJS LoggerService implementation backed by Pino.
 * Ensures the application uses the configured Pino instance everywhere.
 */
@Injectable()
export class PinoLoggerService implements LoggerService {
  private readonly logger: PinoInstance;

  constructor(private readonly configService: ConfigService) {
    this.logger = createPinoLogger(configService);
  }

  /**
   * Access to the underlying Pino instance for advanced integrations.
   */
  get instance(): PinoInstance {
    return this.logger;
  }

  /**
   * Create a child logger with additional bindings.
   */
  child(bindings: Bindings): PinoInstance {
    return this.logger.child(bindings);
  }

  log(message: any, context?: string) {
    this.logger.info(this.buildPayload(message, context));
  }

  error(message: any, trace?: string, context?: string) {
    this.logger.error(this.buildPayload(message, context, trace));
  }

  warn(message: any, context?: string) {
    this.logger.warn(this.buildPayload(message, context));
  }

  debug(message: any, context?: string) {
    this.logger.debug(this.buildPayload(message, context));
  }

  verbose(message: any, context?: string) {
    this.logger.trace(this.buildPayload(message, context));
  }

  private buildPayload(message: any, context?: string, trace?: string) {
    if (message instanceof Error) {
      return {
        err: { message: message.message, stack: message.stack },
        context,
        trace,
      };
    }

    if (typeof message === 'object') {
      return { ...message, context, trace };
    }

    return { msg: message, context, trace };
  }
}
