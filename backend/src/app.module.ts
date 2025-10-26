import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { TerminusModule } from '@nestjs/terminus';
import { envValidationSchema } from './config/env.validation';
import { ConfigModule } from './config/config.module';
import { ConfigService } from './config/config.service';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { HealthController } from './health/health.controller';
import { GraphQLConfigModule } from './graphql/graphql.module';
import { WebSocketModule } from './websocket/websocket.module';
import { RedisCacheModule } from './cache/cache.module';
import { QueueModule } from './queues/queue.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { HttpCacheInterceptor } from './cache/cache.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

/**
 * Application Root Module
 * Imports all feature modules and configures global providers
 * Includes performance optimizations, caching, queues, and monitoring
 */
@Module({
  imports: [
    // NestJS ConfigModule for environment variables
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      validationSchema: envValidationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),

    // Custom ConfigModule that exports ConfigService (@Global)
    ConfigModule,

    // Database with Prisma (PostgreSQL)
    DatabaseModule,

    // Rate limiting to prevent DDoS and abuse
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        ttl: configService.rateLimitTtl, // Time to live in seconds
        limit: configService.rateLimitMax, // Max requests per TTL
        ignoreUserAgents: [/googlebot/gi, /bingbot/gi], // Whitelist bots
      }),
    }),

    // Redis cache for high performance
    RedisCacheModule,

    // Bull queues for asynchronous job processing
    QueueModule,

    // Monitoring & metrics (Prometheus)
    MonitoringModule,

    // Feature modules
    TerminusModule,
    HealthModule,
    GraphQLConfigModule,
    WebSocketModule,
  ],

  controllers: [HealthController],

  providers: [
    // Global exception filter for consistent error handling
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    // Global rate limiting guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Global cache interceptor for automatic caching
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpCacheInterceptor,
    },
  ],
})
export class AppModule {}
