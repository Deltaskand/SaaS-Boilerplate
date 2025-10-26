import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { ConfigService } from './config.service';
import { ConfigModule } from './config.module';

describe('ConfigService', () => {
  let service: ConfigService;

  beforeEach(async () => {
    process.env.NODE_ENV = 'test';
    process.env.PORT = '3000';
    process.env.APP_NAME = 'Test App';
    process.env.APP_URL = 'http://localhost:3000';
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
    process.env.JWT_SECRET = 'test-secret-key-minimum-32-chars-long';
    process.env.CORS_ORIGIN = 'http://localhost:3001';
    process.env.REDIS_HOST = 'localhost';
    process.env.REDIS_PORT = '6379';

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        NestConfigModule.forRoot({
          isGlobal: true,
        }),
        ConfigModule,
      ],
    }).compile();

    service = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Application Config', () => {
    it('should return correct node environment', () => {
      expect(service.nodeEnv).toBe('test');
    });

    it('should return correct port', () => {
      expect(service.port).toBe(3000);
    });

    it('should return correct app name', () => {
      expect(service.appName).toBe('Test App');
    });

    it('should return correct app URL', () => {
      expect(service.appUrl).toBe('http://localhost:3000');
    });

    it('should identify test environment', () => {
      expect(service.isTest).toBe(true);
      expect(service.isDevelopment).toBe(false);
      expect(service.isProduction).toBe(false);
    });
  });

  describe('Database Config', () => {
    it('should return database URL', () => {
      expect(service.databaseUrl).toContain('postgresql://');
    });

    it('should return Redis host', () => {
      expect(service.redisHost).toBe('localhost');
    });

    it('should return Redis port', () => {
      expect(service.redisPort).toBe(6379);
    });
  });

  describe('Security Config', () => {
    it('should return JWT secret', () => {
      expect(service.jwtSecret).toBe('test-secret-key-minimum-32-chars-long');
    });

    it('should return JWT access expiration', () => {
      expect(service.jwtAccessExpiration).toBe('15m');
    });

    it('should return JWT refresh expiration', () => {
      expect(service.jwtRefreshExpiration).toBe('7d');
    });
  });

  describe('CORS Config', () => {
    it('should return CORS origin as string', () => {
      expect(service.corsOrigin).toBe('http://localhost:3001');
    });

    it('should return CORS origin as array when comma-separated', () => {
      process.env.CORS_ORIGIN = 'http://localhost:3001,http://localhost:3002';
      const newService = new ConfigService(service['configService']);
      expect(newService.corsOrigin).toEqual(['http://localhost:3001', 'http://localhost:3002']);
    });
  });

  describe('Rate Limiting Config', () => {
    it('should return default rate limit TTL', () => {
      expect(service.rateLimitTtl).toBe(900);
    });

    it('should return default rate limit max', () => {
      expect(service.rateLimitMax).toBe(100);
    });
  });
});
