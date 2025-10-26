import { Controller, Get } from '@nestjs/common';
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
  getMetrics(): string {
    return this.metricsService.getMetrics();
  }
}
