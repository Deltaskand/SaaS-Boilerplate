import { Test, TestingModule } from '@nestjs/testing';
import { HealthCheckService, MongooseHealthIndicator } from '@nestjs/terminus';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  let healthCheckService: HealthCheckService;
  let mongooseHealthIndicator: MongooseHealthIndicator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: {
            check: jest.fn(),
          },
        },
        {
          provide: MongooseHealthIndicator,
          useValue: {
            pingCheck: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthCheckService = module.get<HealthCheckService>(HealthCheckService);
    mongooseHealthIndicator = module.get<MongooseHealthIndicator>(MongooseHealthIndicator);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('check', () => {
    it('should return health check result', async () => {
      const expectedResult = {
        status: 'ok',
        info: {
          database: {
            status: 'up',
          },
        },
        details: {},
      };

      jest.spyOn(healthCheckService, 'check').mockResolvedValue(expectedResult as any);

      const result = await controller.check();

      expect(result).toEqual(expectedResult);
      expect(healthCheckService.check).toHaveBeenCalled();
    });

    it('should check database health', async () => {
      jest.spyOn(healthCheckService, 'check').mockImplementation(async (checks) => {
        // Execute the health checks
        await Promise.all(checks.map((check) => check()));
        return {
          status: 'ok',
          info: {},
          details: {},
        } as any;
      });

      jest.spyOn(mongooseHealthIndicator, 'pingCheck').mockResolvedValue({
        database: { status: 'up' },
      } as any);

      await controller.check();

      expect(mongooseHealthIndicator.pingCheck).toHaveBeenCalledWith('database');
    });
  });

  describe('liveness', () => {
    it('should return ok status', () => {
      const result = controller.liveness();
      expect(result).toEqual({ status: 'ok' });
    });
  });

  describe('readiness', () => {
    it('should return readiness check result', async () => {
      const expectedResult = {
        status: 'ok',
        info: {
          database: {
            status: 'up',
          },
        },
        details: {},
      };

      jest.spyOn(healthCheckService, 'check').mockResolvedValue(expectedResult as any);

      const result = await controller.readiness();

      expect(result).toEqual(expectedResult);
      expect(healthCheckService.check).toHaveBeenCalled();
    });
  });
});
