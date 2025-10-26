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
    it('should increment counter metric', () => {
      service.incrementCounter('http_requests_total', 1);
      const metrics = service.getMetrics();
      expect(metrics).toContain('http_requests_total 1');
    });

    it('should increment counter multiple times', () => {
      service.incrementCounter('http_requests_total', 1);
      service.incrementCounter('http_requests_total', 2);
      const metrics = service.getMetrics();
      expect(metrics).toContain('http_requests_total 3');
    });

    it('should support labels', () => {
      service.incrementCounter('http_requests_total', 1, { method: 'GET', status: '200' });
      const metrics = service.getMetrics();
      expect(metrics).toContain('http_requests_total{method="GET",status="200"} 1');
    });
  });

  describe('setGauge', () => {
    it('should set gauge metric', () => {
      service.setGauge('active_connections', 42);
      const metrics = service.getMetrics();
      expect(metrics).toContain('active_connections 42');
    });

    it('should overwrite gauge value', () => {
      service.setGauge('active_connections', 42);
      service.setGauge('active_connections', 100);
      const metrics = service.getMetrics();
      expect(metrics).toContain('active_connections 100');
    });
  });

  describe('getMetrics', () => {
    it('should return metrics in Prometheus format', () => {
      service.incrementCounter('test_counter', 5);
      const metrics = service.getMetrics();
      expect(metrics).toContain('test_counter 5');
    });

    it('should include Node.js default metrics', () => {
      const metrics = service.getMetrics();
      expect(metrics).toContain('nodejs_heap_used_bytes');
      expect(metrics).toContain('nodejs_heap_total_bytes');
      expect(metrics).toContain('nodejs_rss_bytes');
      expect(metrics).toContain('nodejs_uptime_seconds');
    });
  });

  describe('reset', () => {
    it('should clear all metrics', () => {
      service.incrementCounter('test_counter', 5);
      service.reset();
      const metrics = service.getMetrics();
      expect(metrics).not.toContain('test_counter');
    });
  });
});
