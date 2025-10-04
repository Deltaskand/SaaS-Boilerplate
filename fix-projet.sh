#!/bin/bash

# Script de Correction - SaaS Boilerplate Script 1
# Supprime les fichiers obsolètes et corrige les problèmes

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}╔════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║   Correction - SaaS Boilerplate Script 1  ║${NC}"
echo -e "${YELLOW}╚════════════════════════════════════════════╝${NC}"

# Vérifier qu'on est dans le bon dossier
if [ ! -d "backend" ]; then
    echo -e "${RED}❌ Exécutez ce script depuis la racine du projet (où se trouve backend/)${NC}"
    exit 1
fi

cd backend

echo -e "\n${YELLOW}[1/5] Suppression des fichiers obsolètes...${NC}"

# Supprimer les modules qui ne font pas partie du Script 1
rm -rf src/auth
rm -rf src/billing
rm -rf src/crm
rm -rf src/users
rm -rf src/config/prisma
rm -rf src/common/interceptors/transform.interceptor.ts

echo -e "${GREEN}✅ Fichiers obsolètes supprimés${NC}"

echo -e "\n${YELLOW}[2/5] Correction du WebSocket Gateway...${NC}"

# Corriger app.gateway.ts
cat > src/websocket/app.gateway.ts << 'EOF'
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ConfigService } from '../config/config.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/ws',
})
export class AppGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(AppGateway.name);

  constructor(private readonly configService: ConfigService) {}

  afterInit(_server: Server) {
    this.logger.log('WebSocket Gateway initialized');
    const corsOrigin = this.configService.websocketCorsOrigin;
    this.logger.log(`WebSocket CORS origin: ${corsOrigin}`);
  }

  handleConnection(client: Socket) {
    const clientId = client.id;
    this.logger.log(`Client connected: ${clientId}`);
    client.emit('connected', {
      message: 'Connected to SaaS Boilerplate WebSocket',
      clientId,
      timestamp: new Date().toISOString(),
    });
  }

  handleDisconnect(client: Socket) {
    const clientId = client.id;
    this.logger.log(`Client disconnected: ${clientId}`);
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket): void {
    client.emit('pong', {
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('message')
  handleMessage(@MessageBody() data: any, @ConnectedSocket() client: Socket): void {
    this.logger.debug(`Message from ${client.id}:`, data);
    client.emit('message', {
      echo: data,
      timestamp: new Date().toISOString(),
    });
  }

  broadcastMessage(event: string, data: any): void {
    this.server.emit(event, data);
    this.logger.debug(`Broadcast: ${event}`, data);
  }

  sendToClient(clientId: string, event: string, data: any): void {
    this.server.to(clientId).emit(event, data);
    this.logger.debug(`Message to ${clientId}: ${event}`, data);
  }
}
EOF

echo -e "${GREEN}✅ WebSocket Gateway corrigé${NC}"

echo -e "\n${YELLOW}[3/5] Suppression des tests obsolètes...${NC}"

# Supprimer les fichiers de test des modules qui n'existent pas
find src -name "*.spec.ts" -path "*/auth/*" -delete
find src -name "*.spec.ts" -path "*/billing/*" -delete
find src -name "*.spec.ts" -path "*/crm/*" -delete
find src -name "*.spec.ts" -path "*/users/*" -delete

echo -e "${GREEN}✅ Tests obsolètes supprimés${NC}"

echo -e "\n${YELLOW}[4/5] Correction des tests ConfigService...${NC}"

# Corriger les tests pour utiliser les vraies valeurs de .env.local
cat > src/config/config.service.spec.ts << 'EOF'
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { ConfigService } from './config.service';
import { envValidationSchema } from './env.validation';

describe('ConfigService', () => {
  let service: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        NestConfigModule.forRoot({
          envFilePath: '.env.local',
          validationSchema: envValidationSchema,
          validationOptions: {
            allowUnknown: true,
            abortEarly: false,
          },
        }),
      ],
      providers: [ConfigService],
    }).compile();

    service = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Application Configuration', () => {
    it('should return node environment', () => {
      expect(service.nodeEnv).toBeDefined();
      expect(['development', 'production', 'test', 'staging']).toContain(service.nodeEnv);
    });

    it('should return port', () => {
      expect(service.port).toBeDefined();
      expect(typeof service.port).toBe('number');
    });

    it('should return app name', () => {
      expect(service.appName).toBe('SaaS Boilerplate');
    });

    it('should return app URL', () => {
      expect(service.appUrl).toBeDefined();
      expect(service.appUrl).toContain('http');
    });

    it('should detect environment correctly', () => {
      const env = service.nodeEnv;
      if (env === 'development') expect(service.isDevelopment).toBe(true);
      if (env === 'production') expect(service.isProduction).toBe(true);
      if (env === 'test') expect(service.isTest).toBe(true);
    });
  });

  describe('Database Configuration', () => {
    it('should return mongodb URI', () => {
      expect(service.mongodbUri).toBeDefined();
      expect(service.mongodbUri).toContain('mongodb://');
    });
  });

  describe('Logging Configuration', () => {
    it('should return log level', () => {
      expect(service.logLevel).toBeDefined();
      expect(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).toContain(
        service.logLevel,
      );
    });
  });

  describe('CORS Configuration', () => {
    it('should return CORS origin', () => {
      const origin = service.corsOrigin;
      expect(origin).toBeDefined();
    });
  });

  describe('JWT Configuration', () => {
    it('should return JWT secret', () => {
      expect(service.jwtSecret).toBeDefined();
      expect(service.jwtSecret.length).toBeGreaterThanOrEqual(32);
    });

    it('should return JWT expiration times', () => {
      expect(service.jwtAccessExpiration).toBeDefined();
      expect(service.jwtRefreshExpiration).toBeDefined();
    });
  });

  describe('Rate Limiting Configuration', () => {
    it('should return rate limit configuration', () => {
      expect(service.rateLimitTtl).toBeDefined();
      expect(service.rateLimitMax).toBeDefined();
    });
  });

  describe('GraphQL Configuration', () => {
    it('should return GraphQL configuration', () => {
      expect(typeof service.graphqlPlayground).toBe('boolean');
      expect(typeof service.graphqlIntrospection).toBe('boolean');
    });
  });

  describe('WebSocket Configuration', () => {
    it('should return WebSocket configuration', () => {
      expect(service.websocketPort).toBeDefined();
      expect(service.websocketCorsOrigin).toBeDefined();
    });
  });

  describe('Multi-Tenant Configuration', () => {
    it('should return multi-tenant status', () => {
      expect(typeof service.multiTenantEnabled).toBe('boolean');
    });
  });
});
EOF

echo -e "${GREEN}✅ Tests ConfigService corrigés${NC}"

echo -e "\n${YELLOW}[5/5] Nettoyage et réinstallation...${NC}"

# Nettoyer node_modules et réinstaller
rm -rf node_modules package-lock.json
npm install

echo -e "\n${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          ✅ Correction Terminée !          ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"

echo -e "\n${YELLOW}Prochaines étapes :${NC}"
echo "1. Lancer les tests : npm run test:cov"
echo "2. Démarrer l'app : npm run start:dev"
echo "3. Tester : curl http://localhost:3000/health"
EOF
