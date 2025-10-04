#!/bin/bash

# Correction de l'injection ConfigService dans DatabaseModule

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Correction Injection ConfigService${NC}"
echo -e "${BLUE}════════════════════════════════════════════${NC}"

echo -e "\n${YELLOW}[1/2] Création de config/config.module.ts...${NC}"

cat > src/config/config.module.ts << 'EOF'
import { Module, Global } from '@nestjs/common';
import { ConfigService } from './config.service';

/**
 * Config Module
 * @Global decorator makes ConfigService available everywhere
 * No need to import this module in other modules
 */
@Global()
@Module({
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
EOF

echo -e "${GREEN}✅ config.module.ts créé${NC}"

echo -e "\n${YELLOW}[2/2] Correction de app.module.ts...${NC}"

cat > src/app.module.ts << 'EOF'
import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { envValidationSchema } from './config/env.validation';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { HealthController } from './health/health.controller';
import { GraphQLConfigModule } from './graphql/graphql.module';
import { WebSocketModule } from './websocket/websocket.module';
import { TerminusModule } from '@nestjs/terminus';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { APP_FILTER } from '@nestjs/core';

/**
 * Application Root Module
 * Imports all feature modules and configures global providers
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
    // Feature modules
    DatabaseModule,
    GraphQLConfigModule,
    WebSocketModule,
    TerminusModule,
  ],
  controllers: [HealthController],
  providers: [
    // Global exception filter
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
EOF

echo -e "${GREEN}✅ app.module.ts corrigé${NC}"

echo -e "\n${GREEN}════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Correction terminée !${NC}"
echo -e "${GREEN}════════════════════════════════════════════${NC}"

echo -e "\n${BLUE}Explication du problème et de la solution :${NC}"
echo ""
echo "❌ PROBLÈME :"
echo "   DatabaseModule utilisait ConfigService via injection"
echo "   Mais ConfigService n'était pas dans un module exporté"
echo "   → Erreur : 'Can't resolve dependencies'"
echo ""
echo "✅ SOLUTION :"
echo "   1. Créer ConfigModule avec @Global()"
echo "   2. ConfigModule exporte ConfigService"
echo "   3. Import ConfigModule dans AppModule"
echo "   4. ConfigService maintenant accessible partout"
echo ""
echo -e "${YELLOW}Démarrage de l'application...${NC}"
npm run start:dev
