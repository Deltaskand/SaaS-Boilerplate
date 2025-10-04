import * as Joi from 'joi';

/**
 * Configuration schema avec validation stricte
 * Chaque variable d'environnement est validée au démarrage
 */
export const configValidationSchema = Joi.object({
  // Application
  NODE_ENV: Joi.string().valid('development', 'production', 'test', 'staging').default('development'),
  PORT: Joi.number().default(3000),
  APP_NAME: Joi.string().default('SaaS Boilerplate'),
  APP_URL: Joi.string().uri().required(),
  API_PREFIX: Joi.string().default('api/v1'),

  // Database
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_DATABASE: Joi.string().required(),
  DB_SYNCHRONIZE: Joi.boolean().default(false),
  DB_LOGGING: Joi.boolean().default(false),

  // Redis
  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').optional(),
  REDIS_DB: Joi.number().default(0),

  // JWT
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRATION: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRATION: Joi.string().default('7d'),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),

  // Rate Limiting
  RATE_LIMIT_TTL: Joi.number().default(60),
  RATE_LIMIT_MAX: Joi.number().default(100),

  // Stripe
  STRIPE_SECRET_KEY: Joi.string().required(),
  STRIPE_WEBHOOK_SECRET: Joi.string().required(),
  STRIPE_PRICE_FREE: Joi.string().optional(),
  STRIPE_PRICE_PRO: Joi.string().required(),
  STRIPE_PRICE_ENTERPRISE: Joi.string().required(),

  // SMTP
  SMTP_HOST: Joi.string().required(),
  SMTP_PORT: Joi.number().default(587),
  SMTP_SECURE: Joi.boolean().default(false),
  SMTP_USER: Joi.string().email().required(),
  SMTP_PASSWORD: Joi.string().required(),
  SMTP_FROM: Joi.string().email().required(),

  // Monitoring
  PROMETHEUS_ENABLED: Joi.boolean().default(true),
  PROMETHEUS_PORT: Joi.number().default(9090),

  // Security
  CORS_ORIGINS: Joi.string().required(),
  COOKIE_SECRET: Joi.string().min(32).required(),
  SESSION_SECRET: Joi.string().min(32).required(),

  // Logging
  LOG_LEVEL: Joi.string().valid('trace', 'debug', 'info', 'warn', 'error', 'fatal').default('info'),
  LOG_PRETTY: Joi.boolean().default(true),

  // GDPR
  DATA_RETENTION_DAYS: Joi.number().default(365),
  ANONYMIZATION_ENABLED: Joi.boolean().default(true),

  // Feature Flags
  FEATURE_SIGNUP_ENABLED: Joi.boolean().default(true),
  FEATURE_GOOGLE_AUTH_ENABLED: Joi.boolean().default(false),
  FEATURE_GITHUB_AUTH_ENABLED: Joi.boolean().default(false),
});

/**
 * Interface de configuration typée
 */
export interface IAppConfig {
  nodeEnv: string;
  port: number;
  appName: string;
  appUrl: string;
  apiPrefix: string;
}

export interface IDatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  synchronize: boolean;
  logging: boolean;
}

export interface IRedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
}

export interface IJwtConfig {
  secret: string;
  accessExpiration: string;
  refreshExpiration: string;
  refreshSecret: string;
}

export interface IStripeConfig {
  secretKey: string;
  webhookSecret: string;
  priceFree?: string;
  pricePro: string;
  priceEnterprise: string;
}

/**
 * Factory pour créer la configuration de l'application
 */
export const configuration = (): Record<string, unknown> => ({
  app: {
    nodeEnv: process.env.NODE_ENV,
    port: parseInt(process.env.PORT || '3000', 10),
    appName: process.env.APP_NAME,
    appUrl: process.env.APP_URL,
    apiPrefix: process.env.API_PREFIX,
  },
  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
    logging: process.env.DB_LOGGING === 'true',
  },
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    accessExpiration: process.env.JWT_ACCESS_EXPIRATION,
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    priceFree: process.env.STRIPE_PRICE_FREE,
    pricePro: process.env.STRIPE_PRICE_PRO,
    priceEnterprise: process.env.STRIPE_PRICE_ENTERPRISE,
  },
  security: {
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || [],
    cookieSecret: process.env.COOKIE_SECRET,
    sessionSecret: process.env.SESSION_SECRET,
  },
  logging: {
    level: process.env.LOG_LEVEL,
    pretty: process.env.LOG_PRETTY === 'true',
  },
  rateLimit: {
    ttl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },
  gdpr: {
    dataRetentionDays: parseInt(process.env.DATA_RETENTION_DAYS || '365', 10),
    anonymizationEnabled: process.env.ANONYMIZATION_ENABLED === 'true',
  },
  features: {
    signupEnabled: process.env.FEATURE_SIGNUP_ENABLED === 'true',
    googleAuthEnabled: process.env.FEATURE_GOOGLE_AUTH_ENABLED === 'true',
    githubAuthEnabled: process.env.FEATURE_GITHUB_AUTH_ENABLED === 'true',
  },
});
