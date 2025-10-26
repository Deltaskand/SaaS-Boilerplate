import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

/**
 * Custom Configuration Service
 * Provides type-safe access to environment variables
 */
@Injectable()
export class ConfigService {
  constructor(private readonly configService: NestConfigService) {}

  // Application
  get nodeEnv(): string {
    return this.configService.get<string>('NODE_ENV', 'development');
  }

  get port(): number {
    return this.configService.get<number>('PORT', 3000);
  }

  get appName(): string {
    return this.configService.get<string>('APP_NAME', 'SaaS Boilerplate');
  }

  get appUrl(): string {
    return this.configService.get<string>('APP_URL')!;
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get isTest(): boolean {
    return this.nodeEnv === 'test';
  }

  // Database
  get databaseUrl(): string {
    return this.configService.get<string>('DATABASE_URL')!;
  }

  get redisHost(): string {
    return this.configService.get<string>('REDIS_HOST', 'localhost');
  }

  get redisPort(): number {
    return this.configService.get<number>('REDIS_PORT', 6379);
  }

  get redisPassword(): string | undefined {
    return this.configService.get<string>('REDIS_PASSWORD');
  }

  // Logging
  get logLevel(): string {
    return this.configService.get<string>('LOG_LEVEL', 'info');
  }

  // CORS
  get corsOrigin(): string | string[] {
    const origin = this.configService.get<string>('CORS_ORIGIN')!;
    // Support multiple origins separated by comma
    return origin.includes(',') ? origin.split(',').map((o) => o.trim()) : origin;
  }

  // Security - JWT
  get jwtSecret(): string {
    return this.configService.get<string>('JWT_SECRET')!;
  }

  get jwtAccessExpiration(): string {
    return this.configService.get<string>('JWT_ACCESS_EXPIRATION', '15m');
  }

  get jwtRefreshExpiration(): string {
    return this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d');
  }

  // Rate Limiting
  get rateLimitTtl(): number {
    return this.configService.get<number>('RATE_LIMIT_TTL', 900);
  }

  get rateLimitMax(): number {
    return this.configService.get<number>('RATE_LIMIT_MAX', 100);
  }

  // GraphQL
  get graphqlPlayground(): boolean {
    return this.configService.get<boolean>('GRAPHQL_PLAYGROUND', true);
  }

  get graphqlIntrospection(): boolean {
    return this.configService.get<boolean>('GRAPHQL_INTROSPECTION', true);
  }

  // WebSockets
  get websocketPort(): number {
    return this.configService.get<number>('WEBSOCKET_PORT', 3000);
  }

  get websocketCorsOrigin(): string | string[] {
    const origin = this.configService.get<string>('WEBSOCKET_CORS_ORIGIN')!;
    return origin.includes(',') ? origin.split(',').map((o) => o.trim()) : origin;
  }

  // Multi-Tenant
  get multiTenantEnabled(): boolean {
    return this.configService.get<boolean>('MULTI_TENANT_ENABLED', false);
  }

  // External Services (Scripts 4-5)
  get sendgridApiKey(): string | undefined {
    return this.configService.get<string>('SENDGRID_API_KEY');
  }

  get sendgridFromEmail(): string | undefined {
    return this.configService.get<string>('SENDGRID_FROM_EMAIL');
  }

  get sendgridFromName(): string | undefined {
    return this.configService.get<string>('SENDGRID_FROM_NAME');
  }

  get stripeSecretKey(): string | undefined {
    return this.configService.get<string>('STRIPE_SECRET_KEY');
  }

  get stripePublishableKey(): string | undefined {
    return this.configService.get<string>('STRIPE_PUBLISHABLE_KEY');
  }

  get stripeWebhookSecret(): string | undefined {
    return this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
  }

  get zohoClientId(): string | undefined {
    return this.configService.get<string>('ZOHO_CLIENT_ID');
  }

  get zohoClientSecret(): string | undefined {
    return this.configService.get<string>('ZOHO_CLIENT_SECRET');
  }

  get zohoRefreshToken(): string | undefined {
    return this.configService.get<string>('ZOHO_REFRESH_TOKEN');
  }

  get zohoApiDomain(): string | undefined {
    return this.configService.get<string>('ZOHO_API_DOMAIN');
  }

  get googleClientId(): string | undefined {
    return this.configService.get<string>('GOOGLE_CLIENT_ID');
  }

  get googleClientSecret(): string | undefined {
    return this.configService.get<string>('GOOGLE_CLIENT_SECRET');
  }

  get googleCallbackUrl(): string | undefined {
    return this.configService.get<string>('GOOGLE_CALLBACK_URL');
  }

  get githubClientId(): string | undefined {
    return this.configService.get<string>('GITHUB_CLIENT_ID');
  }

  get githubClientSecret(): string | undefined {
    return this.configService.get<string>('GITHUB_CLIENT_SECRET');
  }

  get githubCallbackUrl(): string | undefined {
    return this.configService.get<string>('GITHUB_CALLBACK_URL');
  }
}
