import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  HealthCheckService,
  HealthCheck,
  MongooseHealthIndicator,
  HealthCheckResult,
} from '@nestjs/terminus';

/**
 * Health Controller
 * Provides health check endpoints for monitoring
 */
@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: MongooseHealthIndicator,
  ) {}

  /**
   * Main health check endpoint
   * Checks database connectivity
   */
  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'The Health Check is successful',
  })
  @ApiResponse({
    status: 503,
    description: 'The Health Check is not successful',
  })
  check(): Promise<HealthCheckResult> {
    return this.health.check([
      (): Promise<any> => this.db.pingCheck('database'),
    ]);
  }

  /**
   * Liveness probe for Kubernetes
   * Returns OK if application is running
   */
  @Get('live')
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiResponse({
    status: 200,
    description: 'Application is alive',
  })
  liveness(): { status: string } {
    return { status: 'ok' };
  }

  /**
   * Readiness probe for Kubernetes
   * Checks if application is ready to accept traffic
   */
  @Get('ready')
  @HealthCheck()
  @ApiOperation({ summary: 'Readiness probe' })
  @ApiResponse({
    status: 200,
    description: 'Application is ready',
  })
  @ApiResponse({
    status: 503,
    description: 'Application is not ready',
  })
  readiness(): Promise<HealthCheckResult> {
    return this.health.check([
      (): Promise<any> => this.db.pingCheck('database'),
    ]);
  }
}
