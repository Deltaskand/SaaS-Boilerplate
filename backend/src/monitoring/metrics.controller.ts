import { Controller, Get, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiExcludeEndpoint } from '@nestjs/swagger';
import { MetricsService } from './metrics.service';

/**
 * Metrics Controller
 * Exposes metrics endpoint for Prometheus scraping
 */
@ApiTags('Monitoring')
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  /**
   * Prometheus metrics endpoint
   * Returns metrics in Prometheus exposition format
   */
  @Get()
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  @Header('Cache-Control', 'no-store')
  @ApiExcludeEndpoint() // Hide from Swagger docs
  @ApiOperation({ summary: 'Prometheus metrics endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Metrics in Prometheus format',
    content: {
      'text/plain': {
        example: '# TYPE http_requests_total counter\nhttp_requests_total{method="GET",status="200"} 42'
      }
    }
  })
  async getMetrics(): Promise<string> {
    return this.metricsService.getMetrics();
  }
}
