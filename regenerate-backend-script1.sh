#!/bin/bash
# Script de Régénération Backend Script 1 - Version Propre
# Génère un backend NestJS complet avec uniquement les modules Script 1

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Régénération Backend Script 1 - Version Propre       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"

# ÉTAPE 1 : Archivage
echo -e "\n${YELLOW}[1/7] Archivage ancien backend...${NC}"
mkdir -p _archives
timestamp=$(date +%Y%m%d_%H%M%S)
if [ -d "backend" ]; then
  cp -r backend "_archives/backend_corrupted_$timestamp"
  echo -e "${GREEN}✅ Backend archivé : _archives/backend_corrupted_$timestamp${NC}"
fi

# ÉTAPE 2 : Sauvegarde .env
echo -e "\n${YELLOW}[2/7] Sauvegarde .env...${NC}"
if [ -f "backend/.env" ]; then
  cp backend/.env backend/.env.backup
  echo -e "${GREEN}✅ .env sauvegardé${NC}"
else
  echo -e "${YELLOW}⚠️  Pas de .env trouvé${NC}"
fi

# ÉTAPE 3 : Suppression
echo -e "\n${YELLOW}[3/7] Suppression ancien backend...${NC}"
rm -rf backend/src backend/test backend/dist
rm -f backend/*.json backend/*.js backend/*.ts
echo -e "${GREEN}✅ Ancien backend supprimé${NC}"

# ÉTAPE 4 : Création structure
echo -e "\n${YELLOW}[4/7] Création structure...${NC}"
mkdir -p backend/src/{config,database,health,graphql,websocket,common/filters}

# ÉTAPE 5 : Génération fichiers
echo -e "\n${YELLOW}[5/7] Génération fichiers...${NC}"

# package.json
cat > backend/package.json << 'EOF'
{
  "name": "saas-boilerplate-backend",
  "version": "1.0.0",
  "description": "SaaS Boilerplate Backend - Script 1",
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "lint:check": "eslint \"{src,apps,libs,test}/**/*.ts\"",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage --passWithNoTests",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand"
  },
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/config": "^3.0.0",
    "@nestjs/mongoose": "^10.0.0",
    "@nestjs/graphql": "^12.0.0",
    "@nestjs/apollo": "^12.0.0",
    "@nestjs/platform-socket.io": "^10.0.0",
    "@nestjs/websockets": "^10.0.0",
    "@nestjs/swagger": "^7.0.0",
    "@nestjs/terminus": "^10.0.0",
    "@apollo/server": "^4.9.0",
    "graphql": "^16.8.0",
    "mongoose": "^8.0.0",
    "socket.io": "^4.6.0",
    "joi": "^17.11.0",
    "pino": "^8.16.0",
    "pino-pretty": "^10.2.0",
    "helmet": "^7.1.0",
    "compression": "^1.7.4",
    "reflect-metadata": "^0.1.13",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@nestjs/schematics": "^10.0.0",
    "@nestjs/testing": "^10.0.0",
    "@types/express": "^4.17.17",
    "@types/jest": "^29.5.2",
    "@types/node": "^20.3.1",
    "@types/compression": "^1.7.5",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.42.0",
    "eslint-config-prettier": "^9.0.0",
    "eslint-plugin-prettier": "^5.0.0",
    "jest": "^29.5.0",
    "prettier": "^3.0.0",
    "ts-jest": "^29.1.0",
    "ts-loader": "^9.4.3",
    "ts-node": "^10.9.1",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.1.3"
  }
}
EOF

# tsconfig.json
cat > backend/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": false,
    "noImplicitAny": false,
    "strictBindCallApply": false,
    "forceConsistentCasingInFileNames": false,
    "noFallthroughCasesInSwitch": false
  }
}
EOF

# nest-cli.json
cat > backend/nest-cli.json << 'EOF'
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}
EOF

# .eslintrc.js
cat > backend/.eslintrc.js << 'EOF'
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
  },
};
EOF

# jest.config.js
cat > backend/jest.config.js << 'EOF'
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
};
EOF

# src/main.ts
cat > backend/src/main.ts << 'EOF'
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
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
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api', {
    exclude: ['health', 'health/live', 'health/ready'],
  });

  if (!configService.isProduction) {
    const config = new DocumentBuilder()
      .setTitle('SaaS Boilerplate API')
      .setDescription('REST API documentation - Script 1')
      .setVersion('1.0')
      .addTag('Health')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    logger.info(`Swagger: http://localhost:${configService.port}/api/docs`);
  }

  await app.listen(configService.port);

  logger.info(`Application running: http://localhost:${configService.port}`);
  logger.info(`GraphQL: http://localhost:${configService.port}/graphql`);
  logger.info(`Health: http://localhost:${configService.port}/health`);
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Application failed to start:', error);
  process.exit(1);
});
EOF

# src/app.module.ts
cat > backend/src/app.module.ts << 'EOF'
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

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      validationSchema: envValidationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),
    ConfigModule,
    DatabaseModule,
    GraphQLConfigModule,
    WebSocketModule,
    TerminusModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
EOF

echo -e "${GREEN}✅ Fichiers principaux créés${NC}"

# Config files
cat > backend/src/config/config.service.ts << 'EOF'
import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class ConfigService {
  constructor(private configService: NestConfigService) {}

  get nodeEnv(): string {
    return this.configService.get<string>('NODE_ENV', 'development');
  }

  get port(): number {
    return this.configService.get<number>('PORT', 3000);
  }

  get mongoUri(): string {
    return this.configService.get<string>('MONGO_URI', 'mongodb://localhost:27017/saas-boilerplate');
  }

  get corsOrigin(): string {
    return this.configService.get<string>('CORS_ORIGIN', 'http://localhost:3001');
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get graphqlPlayground(): boolean {
    return this.configService.get<boolean>('GRAPHQL_PLAYGROUND', true);
  }

  get graphqlIntrospection(): boolean {
    return this.configService.get<boolean>('GRAPHQL_INTROSPECTION', true);
  }
}
EOF

cat > backend/src/config/config.module.ts << 'EOF'
import { Module, Global } from '@nestjs/common';
import { ConfigService } from './config.service';

@Global()
@Module({
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
EOF

cat > backend/src/config/env.validation.ts << 'EOF'
import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'staging')
    .default('development'),
  PORT: Joi.number().default(3000),
  MONGO_URI: Joi.string().required(),
  CORS_ORIGIN: Joi.string().default('http://localhost:3001'),
  GRAPHQL_PLAYGROUND: Joi.boolean().default(true),
  GRAPHQL_INTROSPECTION: Joi.boolean().default(true),
});
EOF

cat > backend/src/config/configuration.ts << 'EOF'
export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  database: {
    uri: process.env.MONGO_URI,
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  },
});
EOF

echo -e "${GREEN}✅ Config créé${NC}"

# Database
cat > backend/src/database/database.module.ts << 'EOF'
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '../config/config.service';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.mongoUri,
      }),
    }),
  ],
})
export class DatabaseModule {}
EOF

echo -e "${GREEN}✅ Database créé${NC}"

# Health
cat > backend/src/health/health.controller.ts << 'EOF'
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  HealthCheckService,
  HealthCheck,
  MongooseHealthIndicator,
  HealthCheckResult,
} from '@nestjs/terminus';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: MongooseHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Healthy' })
  @ApiResponse({ status: 503, description: 'Unhealthy' })
  check(): Promise<HealthCheckResult> {
    return this.health.check([
      async () => this.db.pingCheck('database'),
    ]);
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiResponse({ status: 200, description: 'Alive' })
  liveness(): { status: string } {
    return { status: 'ok' };
  }

  @Get('ready')
  @HealthCheck()
  @ApiOperation({ summary: 'Readiness probe' })
  @ApiResponse({ status: 200, description: 'Ready' })
  @ApiResponse({ status: 503, description: 'Not ready' })
  readiness(): Promise<HealthCheckResult> {
    return this.health.check([
      async () => this.db.pingCheck('database'),
    ]);
  }
}
EOF

echo -e "${GREEN}✅ Health créé${NC}"

# GraphQL
cat > backend/src/graphql/graphql.module.ts << 'EOF'
import { Module } from '@nestjs/common';
import { GraphQLModule as NestGraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ConfigService } from '../config/config.service';
import { BaseResolver } from './base.resolver';

@Module({
  imports: [
    NestGraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        typePaths: ['./**/*.graphql'],
        playground: configService.graphqlPlayground,
        introspection: configService.graphqlIntrospection,
        cors: {
          origin: configService.corsOrigin,
          credentials: true,
        },
      }),
    }),
  ],
  providers: [BaseResolver],
})
export class GraphQLConfigModule {}
EOF

cat > backend/src/graphql/base.resolver.ts << 'EOF'
import { Query, Resolver } from '@nestjs/graphql';

@Resolver()
export class BaseResolver {
  @Query()
  health() {
    return {
      status: 'ok',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }
}
EOF

cat > backend/src/graphql/schema.graphql << 'EOF'
type HealthResponse {
  status: String!
  version: String!
  timestamp: String!
}

type Query {
  health: HealthResponse!
}
EOF

echo -e "${GREEN}✅ GraphQL créé${NC}"

# WebSocket
cat > backend/src/websocket/websocket.module.ts << 'EOF'
import { Module } from '@nestjs/common';
import { AppGateway } from './app.gateway';

@Module({
  providers: [AppGateway],
})
export class WebSocketModule {}
EOF

cat > backend/src/websocket/app.gateway.ts << 'EOF'
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ConfigService } from '../config/config.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private configService: ConfigService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('ping')
  handlePing() {
    return { event: 'pong', data: { timestamp: Date.now() } };
  }

  @SubscribeMessage('message')
  handleMessage(client: Socket, payload: { data: string }) {
    return { event: 'message', data: payload.data };
  }
}
EOF

echo -e "${GREEN}✅ WebSocket créé${NC}"

# Common
cat > backend/src/common/filters/all-exceptions.filter.ts << 'EOF'
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : 'Internal server error';

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
    });
  }
}
EOF

cat > backend/src/common/logger.config.ts << 'EOF'
import pino from 'pino';
import { ConfigService } from '../config/config.service';

export function createPinoLogger(configService: ConfigService) {
  return pino({
    level: configService.isProduction ? 'info' : 'debug',
    transport: configService.isProduction
      ? undefined
      : {
          target: 'pino-pretty',
          options: {
            colorize: true,
          },
        },
  });
}
EOF

echo -e "${GREEN}✅ Common créé${NC}"

# .env template
cat > backend/.env.example << 'EOF'
NODE_ENV=development
PORT=3000
MONGO_URI=mongodb://localhost:27017/saas-boilerplate
CORS_ORIGIN=http://localhost:3001
GRAPHQL_PLAYGROUND=true
GRAPHQL_INTROSPECTION=true
EOF

# Restore .env
if [ -f "backend/.env.backup" ]; then
  cp backend/.env.backup backend/.env
  echo -e "${GREEN}✅ .env restauré${NC}"
else
  cp backend/.env.example backend/.env
  echo -e "${YELLOW}⚠️  .env créé depuis .env.example${NC}"
fi

echo -e "${GREEN}✅ Tous les fichiers créés (25 fichiers)${NC}"

# ÉTAPE 6 : Installation
echo -e "\n${YELLOW}[6/7] Installation dépendances...${NC}"
cd backend
npm install
echo -e "${GREEN}✅ Dépendances installées${NC}"

# ÉTAPE 7 : Validation
echo -e "\n${YELLOW}[7/7] Validation...${NC}"
npm run build
echo -e "${GREEN}✅ Build réussi${NC}"

echo -e "\n${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║            ✅ Régénération Terminée !                  ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${BLUE}Prochaines étapes :${NC}"
echo "1. cd backend && npm run start:dev"
echo "2. curl http://localhost:3000/health"
echo "3. cd .. && git add backend/"
echo "4. git commit -m 'chore: Regenerate clean backend - Script 1'"
echo "5. git push origin main"
