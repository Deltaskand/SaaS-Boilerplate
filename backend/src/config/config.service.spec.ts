import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { ConfigService } from './config.service';
import { envValidationSchema } from './env.validation';

describe('ConfigService', () => {
  let service: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        NestConfigModule.forRoot({
          envFilePath: '.env.local',
          validationSchema: envValidationSchema,
          validationOptions: {
            allowUnknown: true,
            abortEarly: false,
          },
        }),
      ],
      providers: [ConfigService],
    }).compile();

    service = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Application Configuration', () => {
    it('should return node environment', () => {
      expect(service.nodeEnv).toBeDefined();
      expect(['development', 'production', 'test', 'staging']).toContain(service.nodeEnv);
    });

    it('should return port', () => {
      expect(service.port).toBeDefined();
      expect(typeof service.port).toBe('number');
    });

    it('should return app name', () => {
      expect(service.appName).toBe('SaaS Boilerplate');
    });

    it('should return app URL', () => {
      expect(service.appUrl).toBeDefined();
      expect(service.appUrl).toContain('http');
    });

    it('should detect environment correctly', () => {
      const env = service.nodeEnv;
      if (env === 'development') expect(service.isDevelopment).toBe(true);
      if (env === 'production') expect(service.isProduction).toBe(true);
      if (env === 'test') expect(service.isTest).toBe(true);
    });
  });

  describe('Database Configuration', () => {
    it('should return mongodb URI', () => {
      expect(service.mongodbUri).toBeDefined();
      expect(service.mongodbUri).toContain('mongodb://');
    });
  });

  describe('Logging Configuration', () => {
    it('should return log level', () => {
      expect(service.logLevel).toBeDefined();
      expect(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).toContain(
        service.logLevel,
      );
    });
  });

  describe('CORS Configuration', () => {
    it('should return CORS origin', () => {
      const origin = service.corsOrigin;
      expect(origin).toBeDefined();
    });
  });

  describe('JWT Configuration', () => {
    it('should return JWT secret', () => {
      expect(service.jwtSecret).toBeDefined();
      expect(service.jwtSecret.length).toBeGreaterThanOrEqual(32);
    });

    it('should return JWT expiration times', () => {
      expect(service.jwtAccessExpiration).toBeDefined();
      expect(service.jwtRefreshExpiration).toBeDefined();
    });
  });

  describe('Rate Limiting Configuration', () => {
    it('should return rate limit configuration', () => {
      expect(service.rateLimitTtl).toBeDefined();
      expect(service.rateLimitMax).toBeDefined();
    });
  });

  describe('GraphQL Configuration', () => {
    it('should return GraphQL configuration', () => {
      expect(typeof service.graphqlPlayground).toBe('boolean');
      expect(typeof service.graphqlIntrospection).toBe('boolean');
    });
  });

  describe('WebSocket Configuration', () => {
    it('should return WebSocket configuration', () => {
      expect(service.websocketPort).toBeDefined();
      expect(service.websocketCorsOrigin).toBeDefined();
    });
  });

  describe('Multi-Tenant Configuration', () => {
    it('should return multi-tenant status', () => {
      expect(typeof service.multiTenantEnabled).toBe('boolean');
    });
  });
});
