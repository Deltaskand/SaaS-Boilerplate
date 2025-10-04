import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_FILTER, APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';

// Configuration
import { configuration, configValidationSchema } from './config/configuration';

// Modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { HealthModule } from './modules/health/health.module';

// Common
import { LoggerService } from './common/services/logger.service';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { HttpLoggingInterceptor } from './common/interceptors/http-logging.interceptor';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { Reflector } from '@nestjs/core';

/**
 * Custom JWT Guard qui respecte le decorator @Public()
 */
import { Injectable, ExecutionContext } from '@nestjs/common';
import { IS_PUBLIC_KEY } from './common/decorators';

@Injectable()
class JwtAuthGuardWithPublic extends JwtAuthGuard {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext): Promise<boolean> | boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context) as Promise<boolean> | boolean;
  }
}

/**
 * Module principal de l'application
 * Configuration globale de tous les services
 */
@Module({
  imports: [
    // Configuration avec validation Joi
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: configValidationSchema,
      validationOptions: {
        abortEarly: false,
        allowUnknown: true,
      },
    }),

    // TypeORM avec configuration dynamique
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.database'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
        synchronize: configService.get('database.synchronize'),
        logging: configService.get('database.logging'),
        ssl: configService.get('app.nodeEnv') === 'production' ? { rejectUnauthorized: false } : false,
      }),
    }),

    // Rate limiting global
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            ttl: configService.get('rateLimit.ttl'),
            limit: configService.get('rateLimit.max'),
          },
        ],
      }),
    }),

    // Modules métier
    AuthModule,
    UsersModule,
    HealthModule,
  ],
  providers: [
    LoggerService,

    // Exception filter global
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },

    // HTTP logging interceptor global
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpLoggingInterceptor,
    },

    // JWT Guard global (sauf endpoints @Public())
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuardWithPublic,
    },

    Reflector,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Appliquer le middleware de correlation ID sur toutes les routes
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
