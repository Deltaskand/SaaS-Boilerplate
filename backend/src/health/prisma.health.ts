import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { PrismaService } from '../database/prisma.service';

/**
 * Prisma Health Indicator
 * Custom health indicator for PostgreSQL via Prisma
 */
@Injectable()
export class PrismaHealthIndicator extends HealthIndicator {
  constructor(private readonly prismaService: PrismaService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.prismaService.$queryRaw`SELECT 1`;
      return this.getStatus(key, true, { message: 'PostgreSQL is healthy' });
    } catch (error) {
      throw new HealthCheckError(
        'PostgreSQL check failed',
        this.getStatus(key, false, { message: error instanceof Error ? error.message : 'Unknown error' }),
      );
    }
  }
}
