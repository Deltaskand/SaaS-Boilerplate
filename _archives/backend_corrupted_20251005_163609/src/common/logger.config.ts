import pino from 'pino';
import { ConfigService } from '../config/config.service';

/**
 * Pino Logger Configuration
 * Creates a structured JSON logger with appropriate formatting
 */
export function createPinoLogger(configService: ConfigService) {
  const isDevelopment = configService.isDevelopment;
  const logLevel = configService.logLevel;

  return pino({
    level: logLevel,
    // Pretty print in development for readability
    transport: isDevelopment
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
    // Production: structured JSON logs
    formatters: {
      level: (label) => {
        return { level: label };
      },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    base: {
      env: configService.nodeEnv,
      app: configService.appName,
    },
  });
}
