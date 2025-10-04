#!/bin/bash

# Correction des 5 dernières erreurs TypeScript

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}[1/2] Création du fichier all-exceptions.filter...${NC}"

cat > src/common/filters/all-exceptions.filter.ts << 'EOF'
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: typeof message === 'string' ? message : (message as any).message,
    };

    this.logger.error(
      `${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : 'No stack trace',
    );

    response.status(status).json(errorResponse);
  }
}
EOF

echo -e "${GREEN}✅ all-exceptions.filter.ts créé${NC}"

echo -e "\n${YELLOW}[2/2] Correction graphql.schema.ts...${NC}"

cat > src/graphql/graphql.schema.ts << 'EOF'
/* eslint-disable */
export class HealthResponse {
    status!: string;
    version!: string;
    timestamp!: string;
}

export abstract class IQuery {
    abstract health(): HealthResponse | Promise<HealthResponse>;
}
EOF

echo -e "${GREEN}✅ graphql.schema.ts corrigé${NC}"

echo -e "\n${GREEN}════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Corrections terminées !${NC}"
echo -e "${GREEN}════════════════════════════════════════════${NC}"

echo -e "\n${YELLOW}Build et démarrage :${NC}"
npm run build && npm run start:dev
