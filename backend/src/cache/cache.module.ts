import { Module, Global } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-store';

/**
 * Cache Module
 * Configures Redis cache for the application
 * This is a global module, so caching is available everywhere
 */
@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        store: redisStore as any,
        host: configService.get('REDIS_HOST', 'localhost'),
        port: configService.get('REDIS_PORT', 6379),
        password: configService.get('REDIS_PASSWORD'),
        ttl: 600, // 10 minutes default TTL
        max: 1000, // Maximum number of items in cache
        isGlobal: true,
      }),
    }),
  ],
  exports: [CacheModule],
})
export class RedisCacheModule {}
