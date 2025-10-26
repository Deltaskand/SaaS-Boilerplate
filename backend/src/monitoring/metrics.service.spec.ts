import { Test, TestingModule } from '@nestjs/testing';
import { MetricsService } from './metrics.service';

describe('MetricsService', () => {
  let service: MetricsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MetricsService],
    }).compile();

    service = module.get<MetricsService>(MetricsService);
  });

  afterEach(() => {
    service.reset();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('incrementCounter', () => {
    it('should increment counter metric', async () => {
      service.incrementCounter('http_requests_total', 1);
      const metrics = await service.getMetrics();
      expect(metrics).toContain('http_requests_total 1');
    });

    it('should increment counter multiple times', async () => {
      service.incrementCounter('http_requests_total', 1);
      service.incrementCounter('http_requests_total', 2);
      const metrics = await service.getMetrics();
      expect(metrics).toContain('http_requests_total 3');
    });

    it('should support labels', async () => {
      service.incrementCounter('http_requests_total', 1, { method: 'GET', status: '200' });
      const metrics = await service.getMetrics();
      expect(metrics).toContain('http_requests_total{method="GET",status="200"} 1');
    });
  });

  describe('setGauge', () => {
    it('should set gauge metric', async () => {
      service.setGauge('active_connections', 42);
      const metrics = await service.getMetrics();
      expect(metrics).toContain('active_connections 42');
    });

    it('should overwrite gauge value', async () => {
      service.setGauge('active_connections', 42);
      service.setGauge('active_connections', 100);
      const metrics = await service.getMetrics();
      expect(metrics).toContain('active_connections 100');
    });
  });

  describe('recordHistogram', () => {
    it('should record histogram values', async () => {
      service.recordHistogram('http_request_duration_seconds', 0.5, { method: 'GET' });
      const metrics = await service.getMetrics();
      expect(metrics).toContain('http_request_duration_seconds_bucket{method="GET",le="0.5"} 1');
    });
  });

  describe('getMetrics', () => {
    it('should return metrics in Prometheus format', async () => {
      service.incrementCounter('test_counter', 5);
      const metrics = await service.getMetrics();
      expect(metrics).toContain('# TYPE test_counter counter');
      expect(metrics).toContain('test_counter 5');
    });

    it('should include default process metrics', async () => {
      const metrics = await service.getMetrics();
      expect(metrics).toMatch(/process_resident_memory_bytes/);
    });
  });

  describe('reset', () => {
    it('should clear all metrics', async () => {
      service.incrementCounter('test_counter', 5);
      service.reset();
      const metrics = await service.getMetrics();
      expect(metrics).not.toContain('test_counter 5');
    });
  });
});
