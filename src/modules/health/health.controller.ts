import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  HealthCheckService,
  HealthCheck,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { Public } from '@/common/decorators';

/**
 * Controller de health check
 * Vérifie l'état de santé de l'application et de ses dépendances
 */
@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
  ) {}

  /**
   * Health check global
   */
  @Get()
  @Public()
  @HealthCheck()
  @ApiOperation({ summary: 'Check application health' })
  @ApiResponse({
    status: 200,
    description: 'Application is healthy',
  })
  @ApiResponse({
    status: 503,
    description: 'Application is unhealthy',
  })
  check(): Promise<any> {
    return this.health.check([
      // Vérifier la connexion à la base de données
      () => this.db.pingCheck('database'),

      // Vérifier l'utilisation de la mémoire heap (< 150MB)
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),

      // Vérifier l'utilisation de la mémoire RSS (< 300MB)
      () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024),

      // Vérifier l'espace disque (> 50%)
      () =>
        this.disk.checkStorage('disk', {
          path: '/',
          thresholdPercent: 0.5,
        }),
    ]);
  }

  /**
   * Liveness probe (Kubernetes)
   */
  @Get('liveness')
  @Public()
  @HealthCheck()
  @ApiOperation({ summary: 'Kubernetes liveness probe' })
  liveness() {
    return this.health.check([]);
  }

  /**
   * Readiness probe (Kubernetes)
   */
  @Get('readiness')
  @Public()
  @HealthCheck()
  @ApiOperation({ summary: 'Kubernetes readiness probe' })
  readiness() {
    return this.health.check([() => this.db.pingCheck('database')]);
  }
}
