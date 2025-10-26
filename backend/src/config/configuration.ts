const parseOrigins = (value?: string): string | string[] => {
  if (!value) {
    return [];
  }

  if (value === '*') {
    return value;
  }

  const origins = value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (origins.length === 0) {
    return [];
  }

  return origins.length === 1 ? origins[0] : origins;
};

export default () => {
  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
  const websocketOrigin = process.env.WEBSOCKET_CORS_ORIGIN || corsOrigin;

  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    app: {
      name: process.env.APP_NAME || 'SaaS Boilerplate',
      url: process.env.APP_URL || 'http://localhost:3000',
    },
    database: {
      url: process.env.DATABASE_URL,
    },
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD,
    },
    cors: {
      origin: parseOrigins(corsOrigin),
    },
    websocket: {
      port: parseInt(process.env.WEBSOCKET_PORT || process.env.PORT || '3000', 10),
      origin: parseOrigins(websocketOrigin),
    },
    sentry: {
      dsn: process.env.SENTRY_DSN,
    },
  };
};
