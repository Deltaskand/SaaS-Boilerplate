import { Injectable, Logger } from '@nestjs/common';

type MetricType = 'counter' | 'gauge' | 'histogram';

type CounterMetric = {
  type: 'counter';
  name: string;
  help: string;
  labelNames: string[];
  values: Map<string, number>;
};

type GaugeMetric = {
  type: 'gauge';
  name: string;
  help: string;
  labelNames: string[];
  values: Map<string, number>;
};

type HistogramState = {
  bucketCounts: number[];
  sum: number;
  count: number;
};

type HistogramMetric = {
  type: 'histogram';
  name: string;
  help: string;
  labelNames: string[];
  buckets: number[];
  values: Map<string, HistogramState>;
};

type MetricDefinition = CounterMetric | GaugeMetric | HistogramMetric;

const DEFAULT_BUCKETS = [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5];

/**
 * Metrics Service
 * Collects and exposes application metrics for Prometheus
 */
@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);
  private readonly metrics = new Map<string, MetricDefinition>();

  /**
   * Increment a counter metric
   */
  incrementCounter(name: string, value: number = 1, labels?: Record<string, string>): void {
    const metric = this.getOrCreateCounter(name, labels);
    const key = this.serializeLabelKey(metric.labelNames, labels);
    const current = metric.values.get(key) || 0;
    metric.values.set(key, current + value);
  }

  /**
   * Set a gauge metric
   */
  setGauge(name: string, value: number, labels?: Record<string, string>): void {
    const metric = this.getOrCreateGauge(name, labels);
    const key = this.serializeLabelKey(metric.labelNames, labels);
    metric.values.set(key, value);
  }

  /**
   * Record a histogram value
   */
  recordHistogram(name: string, value: number, labels?: Record<string, string>): void {
    const metric = this.getOrCreateHistogram(name, labels);
    const key = this.serializeLabelKey(metric.labelNames, labels);
    const state =
      metric.values.get(key) || ({ bucketCounts: new Array(metric.buckets.length + 1).fill(0), sum: 0, count: 0 } as HistogramState);

    for (let i = 0; i < metric.buckets.length; i += 1) {
      if (value <= metric.buckets[i]) {
        state.bucketCounts[i] += 1;
      }
    }

    // +Inf bucket
    state.bucketCounts[metric.buckets.length] += 1;

    state.sum += value;
    state.count += 1;

    metric.values.set(key, state);
  }

  /**
   * Get all metrics in Prometheus format
   */
  async getMetrics(): Promise<string> {
    const lines: string[] = [];

    for (const metric of this.metrics.values()) {
      lines.push(`# HELP ${metric.name} ${metric.help}`);
      lines.push(`# TYPE ${metric.name} ${metric.type}`);

      switch (metric.type) {
        case 'counter':
        case 'gauge': {
          for (const [labelKey, value] of metric.values.entries()) {
            const labelSuffix = this.formatLabelSuffix(metric.labelNames, labelKey);
            lines.push(`${metric.name}${labelSuffix} ${value}`);
          }
          break;
        }
        case 'histogram': {
          for (const [labelKey, state] of metric.values.entries()) {
            const baseSuffix = this.formatLabelSuffix(metric.labelNames, labelKey);

            metric.buckets.forEach((bucket, index) => {
              const bucketSuffix = this.appendLabelSuffix(baseSuffix, 'le', bucket.toString());
              lines.push(`${metric.name}_bucket${bucketSuffix} ${state.bucketCounts[index]}`);
            });

            const infSuffix = this.appendLabelSuffix(baseSuffix, 'le', '+Inf');
            lines.push(`${metric.name}_bucket${infSuffix} ${state.bucketCounts[metric.buckets.length]}`);
            lines.push(`${metric.name}_sum${baseSuffix} ${state.sum}`);
            lines.push(`${metric.name}_count${baseSuffix} ${state.count}`);
          }
          break;
        }
        default:
          break;
      }
    }

    lines.push(...this.getProcessMetrics());

    return lines.join('\n');
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics.clear();
    this.logger.log('Metrics reset');
  }

  private getOrCreateCounter(name: string, labels?: Record<string, string>): CounterMetric {
    return this.getOrCreateMetric(name, 'counter', labels, () => ({
      type: 'counter',
      name: this.normalizeName(name),
      help: `${this.normalizeName(name)} counter`,
      labelNames: this.extractLabelNames(labels),
      values: new Map<string, number>(),
    }));
  }

  private getOrCreateGauge(name: string, labels?: Record<string, string>): GaugeMetric {
    return this.getOrCreateMetric(name, 'gauge', labels, () => ({
      type: 'gauge',
      name: this.normalizeName(name),
      help: `${this.normalizeName(name)} gauge`,
      labelNames: this.extractLabelNames(labels),
      values: new Map<string, number>(),
    }));
  }

  private getOrCreateHistogram(name: string, labels?: Record<string, string>): HistogramMetric {
    return this.getOrCreateMetric(name, 'histogram', labels, () => ({
      type: 'histogram',
      name: this.normalizeName(name),
      help: `${this.normalizeName(name)} histogram`,
      labelNames: this.extractLabelNames(labels),
      buckets: DEFAULT_BUCKETS,
      values: new Map<string, HistogramState>(),
    }));
  }

  private getOrCreateMetric<T extends MetricDefinition>(
    name: string,
    expectedType: MetricType,
    labels: Record<string, string> | undefined,
    factory: () => T,
  ): T {
    const metricName = this.normalizeName(name);
    const existing = this.metrics.get(metricName);

    if (existing) {
      if (existing.type !== expectedType) {
        throw new Error(`Metric ${metricName} is already registered as ${existing.type}`);
      }

      this.validateLabelNames(existing.labelNames, labels, metricName);
      return existing as T;
    }

    const metric = factory();
    this.metrics.set(metricName, metric);
    return metric;
  }

  private extractLabelNames(labels?: Record<string, string>): string[] {
    if (!labels) {
      return [];
    }

    return Object.keys(labels)
      .map((label) => label.trim())
      .filter(Boolean)
      .sort();
  }

  private validateLabelNames(existing: string[], labels: Record<string, string> | undefined, metricName: string) {
    const incoming = this.extractLabelNames(labels);
    if (existing.length !== incoming.length || existing.some((label, idx) => label !== incoming[idx])) {
      if (existing.length === 0 && incoming.length === 0) {
        return;
      }
      throw new Error(`Metric ${metricName} expects labels [${existing.join(', ')}], received [${incoming.join(', ')}]`);
    }
  }

  private serializeLabelKey(labelNames: string[], labels?: Record<string, string>): string {
    if (labelNames.length === 0) {
      return '';
    }

    if (!labels) {
      throw new Error(`Labels [${labelNames.join(', ')}] are required`);
    }

    return labelNames
      .map((label) => `${label}=${labels[label] ?? ''}`)
      .join('|');
  }

  private formatLabelSuffix(labelNames: string[], labelKey: string): string {
    if (labelNames.length === 0) {
      return '';
    }

    const pairs = labelKey.split('|').map((pair) => {
      const [key, value] = pair.split('=');
      return `${key}="${this.escapeLabelValue(value)}"`;
    });

    return `{${pairs.join(',')}}`;
  }

  private appendLabelSuffix(baseSuffix: string, key: string, value: string): string {
    const suffixWithoutBraces = baseSuffix.replace(/[{}]/g, '');
    const label = `${key}="${this.escapeLabelValue(value)}"`;

    if (!suffixWithoutBraces) {
      return `{${label}}`;
    }

    return `{${suffixWithoutBraces},${label}}`;
  }

  private escapeLabelValue(value: string): string {
    return value.replace(/"/g, '\\"');
  }

  private getProcessMetrics(): string[] {
    const memoryUsage = process.memoryUsage();
    const lines: string[] = [];

    lines.push('# HELP process_resident_memory_bytes Resident memory size in bytes');
    lines.push('# TYPE process_resident_memory_bytes gauge');
    lines.push(`process_resident_memory_bytes ${memoryUsage.rss}`);

    lines.push('# HELP process_heap_used_bytes Process heap used bytes');
    lines.push('# TYPE process_heap_used_bytes gauge');
    lines.push(`process_heap_used_bytes ${memoryUsage.heapUsed}`);

    lines.push('# HELP process_heap_total_bytes Process heap total bytes');
    lines.push('# TYPE process_heap_total_bytes gauge');
    lines.push(`process_heap_total_bytes ${memoryUsage.heapTotal}`);

    lines.push('# HELP process_uptime_seconds Node.js process uptime in seconds');
    lines.push('# TYPE process_uptime_seconds gauge');
    lines.push(`process_uptime_seconds ${process.uptime()}`);

    return lines;
  }

  private normalizeName(name: string): string {
    return name.replace(/[^a-zA-Z0-9:_]/g, '_');
  }
}
