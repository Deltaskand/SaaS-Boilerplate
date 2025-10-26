import pino from 'pino';
import { ConfigService } from '../config/config.service';
import * as os from 'os';

/**
 * Pino Logger Configuration
 * Creates a structured JSON logger with appropriate formatting
 * Includes sensitive data redaction and rich context
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
            singleLine: false,
          },
        }
      : undefined,

    // Redact sensitive data
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'password',
        'token',
        'apiKey',
        'secret',
        'creditCard',
        'ssn',
        '*.password',
        '*.token',
        '*.apiKey',
        '*.secret',
      ],
      remove: true,
    },

    // Serializers for complex objects
    serializers: {
      req: pino.stdSerializers.req,
      res: pino.stdSerializers.res,
      err: pino.stdSerializers.err,
    },

    // Production: structured JSON logs
    formatters: {
      level: (label) => {
        return { level: label };
      },
    },

    timestamp: pino.stdTimeFunctions.isoTime,

    // Base context for all logs
    base: {
      env: configService.nodeEnv,
      app: configService.appName,
      hostname: os.hostname(),
      pid: process.pid,
      node_version: process.version,
    },

    // Add context to every log
    mixin() {
      return {
        uptime: process.uptime(),
        memory: {
          heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
        },
      };
    },
  });
}
