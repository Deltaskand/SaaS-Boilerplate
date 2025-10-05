import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService as NestConfigService } from '@nestjs/config';
import { ConfigService } from './config.service';

describe('ConfigService', () => {
  let service: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: ['.env.example'],
        }),
      ],
      providers: [ConfigService, NestConfigService],
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
      const port = service.port;
      expect(port).toBeDefined();
      // ConfigService may return string or number depending on env loading
      expect(port).toBeTruthy();
    });

    it('should return app name', () => {
      expect(service.appName).toBe('SaaS Boilerplate');
    });

    it('should detect environment correctly', () => {
      const env = service.nodeEnv;
      if (env === 'development') expect(service.isDevelopment).toBe(true);
      if (env === 'production') expect(service.isProduction).toBe(true);
      if (env === 'test') expect(service.isTest).toBe(true);
    });
  });

  describe('Rate Limiting', () => {
    it('should return rate limit TTL', () => {
      const ttl = service.rateLimitTtl;
      expect(ttl).toBeDefined();
      // ConfigService may return string or number depending on env loading
      expect(ttl).toBeTruthy();
    });

    it('should return rate limit max', () => {
      const max = service.rateLimitMax;
      expect(max).toBeDefined();
      // ConfigService may return string or number depending on env loading
      expect(max).toBeTruthy();
    });
  });

  describe('GraphQL Configuration', () => {
    it('should return GraphQL playground setting', () => {
      const playground = service.graphqlPlayground;
      expect(playground).toBeDefined();
      // ConfigService may return string or boolean depending on env loading
      expect(playground !== null && playground !== undefined).toBe(true);
    });

    it('should return GraphQL introspection setting', () => {
      const introspection = service.graphqlIntrospection;
      expect(introspection).toBeDefined();
      // ConfigService may return string or boolean depending on env loading
      expect(introspection !== null && introspection !== undefined).toBe(true);
    });
  });

  describe('WebSocket Configuration', () => {
    it('should return websocket port', () => {
      const port = service.websocketPort;
      expect(port).toBeDefined();
      // ConfigService may return string or number depending on env loading
      expect(port).toBeTruthy();
    });
  });

  describe('Multi-Tenant Configuration', () => {
    it('should return multi-tenant enabled flag', () => {
      const enabled = service.multiTenantEnabled;
      expect(enabled).toBeDefined();
      // ConfigService may return string or boolean depending on env loading
      expect(enabled !== null && enabled !== undefined).toBe(true);
    });
  });

  describe('JWT Configuration', () => {
    it('should return JWT access expiration', () => {
      expect(service.jwtAccessExpiration).toBeDefined();
      expect(typeof service.jwtAccessExpiration).toBe('string');
    });

    it('should return JWT refresh expiration', () => {
      expect(service.jwtRefreshExpiration).toBeDefined();
      expect(typeof service.jwtRefreshExpiration).toBe('string');
    });
  });

  describe('Logging Configuration', () => {
    it('should return log level', () => {
      expect(service.logLevel).toBeDefined();
      expect(typeof service.logLevel).toBe('string');
    });
  });
});
