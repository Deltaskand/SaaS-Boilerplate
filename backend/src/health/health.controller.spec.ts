import { Test, TestingModule } from '@nestjs/testing';
import { HealthCheckService, HealthCheckResult, MemoryHealthIndicator, DiskHealthIndicator } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { PrismaHealthIndicator } from './prisma.health';

describe('HealthController', () => {
  let controller: HealthController;
  let healthCheckService: HealthCheckService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: {
            check: jest.fn().mockResolvedValue({
              status: 'ok',
              info: { database: { status: 'up' } },
              error: {},
              details: { database: { status: 'up' } },
            } as HealthCheckResult),
          },
        },
        {
          provide: PrismaHealthIndicator,
          useValue: {
            isHealthy: jest.fn().mockResolvedValue({ database: { status: 'up' } }),
          },
        },
        {
          provide: MemoryHealthIndicator,
          useValue: {
            checkHeap: jest.fn().mockResolvedValue({ memory_heap: { status: 'up' } }),
          },
        },
        {
          provide: DiskHealthIndicator,
          useValue: {
            checkStorage: jest.fn().mockResolvedValue({ disk: { status: 'up' } }),
          },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthCheckService = module.get<HealthCheckService>(HealthCheckService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('check', () => {
    it('should return health check result', async () => {
      const result = await controller.check();
      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('info');
      expect(healthCheckService.check).toHaveBeenCalled();
    });

    it('should check database health', async () => {
      await controller.check();
      expect(healthCheckService.check).toHaveBeenCalled();
    });
  });

  describe('liveness', () => {
    it('should return status ok', () => {
      const result = controller.liveness();
      expect(result).toEqual({ status: 'ok' });
    });
  });

  describe('readiness', () => {
    it('should return readiness check result', async () => {
      const result = await controller.readiness();
      expect(result).toHaveProperty('status', 'ok');
      expect(healthCheckService.check).toHaveBeenCalled();
    });

    it('should check database readiness', async () => {
      await controller.readiness();
      expect(healthCheckService.check).toHaveBeenCalled();
    });
  });
});
