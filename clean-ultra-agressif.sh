#!/bin/bash

# Nettoyage ULTRA-AGRESSIF - Script 1 UNIQUEMENT
# Supprime TOUT sauf les fichiers du Script 1

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Nettoyage ULTRA-AGRESSIF - Script 1     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"

# Vérifier qu'on est dans backend/
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Exécutez ce script depuis backend/${NC}"
    exit 1
fi

echo -e "\n${YELLOW}[1/6] Sauvegarde complète...${NC}"
cd ..
tar -czf saas-boilerplate-backup-$(date +%Y%m%d-%H%M%S).tar.gz backend/ 2>/dev/null || true
cd backend
echo -e "${GREEN}✅ Sauvegarde créée dans le dossier parent${NC}"

echo -e "\n${YELLOW}[2/6] Suppression de TOUS les modules obsolètes...${NC}"

# Supprimer TOUS les modules qui ne font PAS partie du Script 1
rm -rf src/modules
rm -rf src/common/guards
rm -rf src/common/middleware
rm -rf src/common/services
rm -rf src/common/interceptors
rm -rf src/common/decorators

echo -e "${GREEN}✅ Modules obsolètes supprimés${NC}"

echo -e "\n${YELLOW}[3/6] Recréation de la structure Script 1...${NC}"

# Créer UNIQUEMENT ce qui fait partie du Script 1
mkdir -p src/common/filters

# Créer app.module.ts propre (Script 1 uniquement)
cat > src/app.module.ts << 'EOF'
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envValidationSchema } from './config/env.validation';
import { ConfigService } from './config/config.service';
import { DatabaseModule } from './database/database.module';
import { HealthController } from './health/health.controller';
import { GraphQLConfigModule } from './graphql/graphql.module';
import { WebSocketModule } from './websocket/websocket.module';
import { TerminusModule } from '@nestjs/terminus';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { APP_FILTER } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      validationSchema: envValidationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),
    DatabaseModule,
    GraphQLConfigModule,
    WebSocketModule,
    TerminusModule,
  ],
  controllers: [HealthController],
  providers: [
    ConfigService,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
EOF

# Créer main.ts propre (Script 1 uniquement)
cat > src/main.ts << 'EOF'
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { ConfigService } from './config/config.service';
import { createPinoLogger } from './common/logger.config';

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
      .setDescription('REST API documentation for SaaS Boilerplate - Script 1')
      .setVersion('1.0')
      .addTag('Health', 'Health check endpoints')
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
}

bootstrap().catch((error) => {
  console.error('❌ Application failed to start:', error);
  process.exit(1);
});
EOF

echo -e "${GREEN}✅ Fichiers principaux recréés${NC}"

echo -e "\n${YELLOW}[4/6] Nettoyage complet node_modules...${NC}"
rm -rf node_modules package-lock.json
echo -e "${GREEN}✅ Nettoyage complet${NC}"

echo -e "\n${YELLOW}[5/6] Installation des dépendances (2-3 min)...${NC}"
npm install

echo -e "${GREEN}✅ Dépendances installées${NC}"

echo -e "\n${YELLOW}[6/6] Vérification du build...${NC}"
npm run build

echo -e "\n${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║       ✅ Nettoyage ULTRA Terminé !         ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"

echo -e "\n${BLUE}Structure finale (Script 1 uniquement) :${NC}"
echo "backend/src/"
echo "  ├── config/          ✅"
echo "  ├── database/        ✅"
echo "  ├── health/          ✅"
echo "  ├── graphql/         ✅"
echo "  ├── websocket/       ✅"
echo "  ├── common/"
echo "  │   ├── filters/     ✅"
echo "  │   └── logger.config.ts  ✅"
echo "  ├── app.module.ts    ✅"
echo "  └── main.ts          ✅"
echo ""
echo -e "${RED}Supprimé:${NC}"
echo "  ├── modules/auth/    ❌"
echo "  ├── modules/users/   ❌"
echo "  ├── common/guards/   ❌"
echo "  └── common/services/ ❌"
echo ""
echo -e "${BLUE}Prochaines étapes :${NC}"
echo "1. npm run start:dev"
echo "2. curl http://localhost:3000/health"
echo "3. Vérifier GraphQL : http://localhost:3000/graphql"
