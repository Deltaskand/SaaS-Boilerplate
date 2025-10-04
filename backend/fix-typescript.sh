#!/bin/bash

# Correction des erreurs TypeScript strict mode

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}[1/4] Correction database.module.ts...${NC}"

cat > src/database/database.module.ts << 'EOF'
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '../config/config.service';

/**
 * Database Module
 * Configures MongoDB connection using Mongoose
 */
@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.mongodbUri,
        retryAttempts: 3,
        retryDelay: 1000,
        connectionFactory: (connection) => {
          connection.on('connected', () => {
            console.log('MongoDB connected successfully');
          });
          connection.on('disconnected', () => {
            console.warn('MongoDB disconnected');
          });
          connection.on('error', (error: Error) => {
            console.error('MongoDB connection error:', error);
          });
          return connection;
        },
      }),
    }),
  ],
})
export class DatabaseModule {}
EOF

echo -e "${GREEN}✅ database.module.ts corrigé${NC}"

echo -e "\n${YELLOW}[2/4] Correction graphql.module.ts...${NC}"

cat > src/graphql/graphql.module.ts << 'EOF'
import { Module } from '@nestjs/common';
import { GraphQLModule as NestGraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { ConfigService } from '../config/config.service';
import { Request, Response } from 'express';

/**
 * GraphQL Module Configuration
 * Configures Apollo Server with schema-first approach
 */
@Module({
  imports: [
    NestGraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        typePaths: ['./**/*.graphql'],
        definitions: {
          path: join(process.cwd(), 'src/graphql/graphql.schema.ts'),
          outputAs: 'class',
        },
        playground: configService.graphqlPlayground,
        introspection: configService.graphqlIntrospection,
        context: ({ req, res }: { req: Request; res: Response }) => ({ req, res }),
        formatError: (error: any) => {
          return {
            message: error.message,
            code: error.extensions?.code || 'INTERNAL_SERVER_ERROR',
            path: error.path,
          };
        },
        cors: {
          origin: configService.corsOrigin,
          credentials: true,
        },
      }),
    }),
  ],
})
export class GraphQLConfigModule {}
EOF

echo -e "${GREEN}✅ graphql.module.ts corrigé${NC}"

echo -e "\n${YELLOW}[3/4] Correction main.ts (import compression)...${NC}"

cat > src/main.ts << 'EOF'
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { ConfigService } from './config/config.service';
import { createPinoLogger } from './common/logger.config';

/**
 * Bootstrap the NestJS application
 * Configures all security, validation, and documentation features
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);
  const logger = createPinoLogger(configService);
  app.useLogger(new Logger());

  app.use(
    helmet({
      contentSecurityPolicy: configService.isProduction
        ? undefined
        : {
            directives: {
              defaultSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            },
          },
      crossOriginEmbedderPolicy: false,
    }),
  );

  app.use(compression());

  app.enableCors({
    origin: configService.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID'],
    exposedHeaders: ['X-Correlation-ID'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.setGlobalPrefix('api', {
    exclude: ['health', 'health/live', 'health/ready'],
  });

  if (!configService.isProduction) {
    const config = new DocumentBuilder()
      .setTitle('SaaS Boilerplate API')
      .setDescription('REST API documentation for SaaS Boilerplate')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT access token',
        },
        'access-token',
      )
      .addTag('Health', 'Health check endpoints')
      .addTag('Auth', 'Authentication endpoints (Script 4)')
      .addTag('Users', 'User management endpoints (Script 3)')
      .addTag('Billing', 'Billing and subscription endpoints (Script 5)')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });

    logger.info(`Swagger documentation available at http://localhost:${configService.port}/api/docs`);
  }

  const port = configService.port;
  await app.listen(port);

  logger.info(`🚀 Application is running on: http://localhost:${port}`);
  logger.info(`📊 GraphQL Playground: http://localhost:${port}/graphql`);
  logger.info(`💓 Health check: http://localhost:${port}/health`);
  logger.info(`🌍 Environment: ${configService.nodeEnv}`);
  logger.info(`📦 Multi-tenant: ${configService.multiTenantEnabled ? 'Enabled' : 'Disabled (will be enabled in Phase 3)'}`);
}

bootstrap().catch((error) => {
  console.error('❌ Application failed to start:', error);
  process.exit(1);
});
EOF

echo -e "${GREEN}✅ main.ts corrigé${NC}"

echo -e "\n${YELLOW}[4/4] Correction package.json (types compression)...${NC}"

# Ajouter @types/compression si manquant
if ! grep -q "@types/compression" package.json; then
  npm install --save-dev @types/compression
fi

echo -e "${GREEN}✅ Types compression installés${NC}"

echo -e "\n${GREEN}════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Toutes les erreurs TypeScript corrigées !${NC}"
echo -e "${GREEN}════════════════════════════════════════════${NC}"

echo -e "\n${YELLOW}Relancer l'application :${NC}"
echo "npm run start:dev"
EOF
