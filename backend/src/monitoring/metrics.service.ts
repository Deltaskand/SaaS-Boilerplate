import { Injectable, Logger } from '@nestjs/common';

/**
 * Metrics Service
 * Collects and exposes application metrics for Prometheus
 */
@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);
  private metrics: Map<string, number> = new Map();

  /**
   * Increment a counter metric
   */
  incrementCounter(name: string, value: number = 1, labels?: Record<string, string>): void {
    const key = this.generateKey(name, labels);
    const current = this.metrics.get(key) || 0;
    this.metrics.set(key, current + value);
  }

  /**
   * Set a gauge metric
   */
  setGauge(name: string, value: number, labels?: Record<string, string>): void {
    const key = this.generateKey(name, labels);
    this.metrics.set(key, value);
  }

  /**
   * Record a histogram value
   */
  recordHistogram(name: string, value: number, labels?: Record<string, string>): void {
    const key = this.generateKey(name, labels);
    // Simple implementation - in production, use proper histogram buckets
    this.metrics.set(key, value);
  }

  /**
   * Get all metrics in Prometheus format
   */
  getMetrics(): string {
    const lines: string[] = [];

    // Convert metrics to Prometheus format
    this.metrics.forEach((value, key) => {
      lines.push(`${key} ${value}`);
    });

    // Add default Node.js metrics
    lines.push(`# TYPE nodejs_heap_used_bytes gauge`);
    lines.push(`nodejs_heap_used_bytes ${process.memoryUsage().heapUsed}`);

    lines.push(`# TYPE nodejs_heap_total_bytes gauge`);
    lines.push(`nodejs_heap_total_bytes ${process.memoryUsage().heapTotal}`);

    lines.push(`# TYPE nodejs_rss_bytes gauge`);
    lines.push(`nodejs_rss_bytes ${process.memoryUsage().rss}`);

    lines.push(`# TYPE nodejs_uptime_seconds counter`);
    lines.push(`nodejs_uptime_seconds ${process.uptime()}`);

    return lines.join('\n');
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics.clear();
    this.logger.log('Metrics reset');
  }

  private generateKey(name: string, labels?: Record<string, string>): string {
    if (!labels) return name;

    const labelStr = Object.entries(labels)
      .map(([key, value]) => `${key}="${value}"`)
      .join(',');

    return `${name}{${labelStr}}`;
  }
}
