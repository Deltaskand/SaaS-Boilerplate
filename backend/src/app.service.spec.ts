import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppService } from './app.service';

describe('AppService', () => {
  let service: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: ['.env.example'],
        }),
      ],
      providers: [AppService, ConfigService],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getInfo', () => {
    it('should return application information', () => {
      const info = service.getInfo();

      expect(info).toBeDefined();
      expect(info.name).toBeDefined();
      expect(info.version).toBe('1.0.0');
      expect(info.description).toBe('Enterprise-grade SaaS Boilerplate Backend');
      expect(info.status).toBe('running');
      expect(info.environment).toBeDefined();
    });

    it('should return correct structure', () => {
      const info = service.getInfo();

      expect(info).toHaveProperty('name');
      expect(info).toHaveProperty('version');
      expect(info).toHaveProperty('description');
      expect(info).toHaveProperty('status');
      expect(info).toHaveProperty('environment');
    });

    it('should return string values for all properties', () => {
      const info = service.getInfo();

      expect(typeof info.name).toBe('string');
      expect(typeof info.version).toBe('string');
      expect(typeof info.description).toBe('string');
      expect(typeof info.status).toBe('string');
      expect(typeof info.environment).toBe('string');
    });
  });
});
