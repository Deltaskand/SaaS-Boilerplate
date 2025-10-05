import * as Joi from 'joi';

/**
 * Environment variables validation schema using Joi
 * Ensures all required environment variables are present and valid
 */
export const envValidationSchema = Joi.object({
  // Application
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'staging')
    .default('development'),
  PORT: Joi.number().default(3000),
  APP_NAME: Joi.string().default('SaaS Boilerplate'),
  APP_URL: Joi.string().uri().required(),

  // Database
  MONGODB_URI: Joi.string().required(),

  // Logging
  LOG_LEVEL: Joi.string().valid('fatal', 'error', 'warn', 'info', 'debug', 'trace').default('info'),

  // CORS
  CORS_ORIGIN: Joi.string().required(),

  // Security
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRATION: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRATION: Joi.string().default('7d'),

  // Rate Limiting
  RATE_LIMIT_TTL: Joi.number().default(900),
  RATE_LIMIT_MAX: Joi.number().default(100),

  // GraphQL
  GRAPHQL_PLAYGROUND: Joi.boolean().default(true),
  GRAPHQL_INTROSPECTION: Joi.boolean().default(true),

  // WebSockets
  WEBSOCKET_PORT: Joi.number().default(3000),
  WEBSOCKET_CORS_ORIGIN: Joi.string().required(),

  // Multi-Tenant
  MULTI_TENANT_ENABLED: Joi.boolean().default(false),

  // External Services (optional for now, will be required in Scripts 4-5)
  SENDGRID_API_KEY: Joi.string().optional(),
  SENDGRID_FROM_EMAIL: Joi.string().email().optional(),
  SENDGRID_FROM_NAME: Joi.string().optional(),

  STRIPE_SECRET_KEY: Joi.string().optional(),
  STRIPE_PUBLISHABLE_KEY: Joi.string().optional(),
  STRIPE_WEBHOOK_SECRET: Joi.string().optional(),

  ZOHO_CLIENT_ID: Joi.string().optional(),
  ZOHO_CLIENT_SECRET: Joi.string().optional(),
  ZOHO_REFRESH_TOKEN: Joi.string().optional(),
  ZOHO_API_DOMAIN: Joi.string().uri().optional(),

  GOOGLE_CLIENT_ID: Joi.string().optional(),
  GOOGLE_CLIENT_SECRET: Joi.string().optional(),
  GOOGLE_CALLBACK_URL: Joi.string().uri().optional(),

  GITHUB_CLIENT_ID: Joi.string().optional(),
  GITHUB_CLIENT_SECRET: Joi.string().optional(),
  GITHUB_CALLBACK_URL: Joi.string().uri().optional(),
});
