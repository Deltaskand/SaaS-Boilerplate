# 🚀 Script 1 - Core & Config

**SaaS Boilerplate Backend - Foundations**

## 📋 Overview

This is **Script 1** of the SaaS Boilerplate project generation. It provides the core infrastructure and configuration for the entire application.

### ✅ What's Included

- ✅ **NestJS Application Bootstrap** with TypeScript strict mode
- ✅ **MongoDB Connection** via Mongoose with health monitoring
- ✅ **GraphQL API** with Apollo Server (schema-first approach)
- ✅ **WebSockets** with Socket.io for real-time communication
- ✅ **Structured Logging** with Pino (JSON format)
- ✅ **Configuration Management** with environment variable validation (Joi)
- ✅ **Health Check Endpoints** (REST + GraphQL)
- ✅ **Global Exception Handling** with correlation ID tracking
- ✅ **Security Headers** (Helmet)
- ✅ **CORS Configuration**
- ✅ **Swagger API Documentation**
- ✅ **Validation Pipes** (class-validator)
- ✅ **Multi-Tenant Architecture** (prepared for Phase 3)
- ✅ **Unit Tests** (>80% coverage)

---

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── config/                    # Configuration module
│   │   ├── config.module.ts
│   │   ├── config.service.ts
│   │   └── env.validation.ts
│   ├── database/                  # MongoDB connection
│   │   └── database.module.ts
│   ├── health/                    # Health check endpoints
│   │   ├── health.module.ts
│   │   └── health.controller.ts
│   ├── graphql/                   # GraphQL configuration
│   │   ├── graphql.module.ts
│   │   ├── schema.graphql
│   │   └── base.resolver.ts
│   ├── websocket/                 # WebSocket gateway
│   │   ├── websocket.module.ts
│   │   └── app.gateway.ts
│   ├── common/                    # Shared utilities
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── interceptors/
│   │   │   └── logging.interceptor.ts
│   │   ├── middleware/
│   │   │   └── correlation-id.middleware.ts
│   │   └── logger.config.ts
│   ├── app.module.ts              # Root application module
│   └── main.ts                    # Application bootstrap
├── test/                          # E2E tests (Script 4)
├── package.json
├── tsconfig.json
├── .env.example
└── README.md                      # This file
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **MongoDB** >= 6.x (running locally or remotely)
- **npm** or **yarn**

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and configure at minimum:
   ```env
   NODE_ENV=development
   PORT=3000
   APP_URL=http://localhost:3000
   MONGODB_URI=mongodb://localhost:27017/saas-boilerplate
   CORS_ORIGIN=http://localhost:3001
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
   WEBSOCKET_CORS_ORIGIN=http://localhost:3001
   ```

3. **Start MongoDB** (if local):
   ```bash
   # Using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest

   # Or using local MongoDB installation
   mongod --dbpath /path/to/data
   ```

4. **Run the application**:
   ```bash
   # Development mode with hot reload
   npm run start:dev

   # Production mode
   npm run build
   npm run start:prod
   ```

---

## 🧪 Testing

```bash
# Unit tests
npm run test

# Unit tests with coverage
npm run test:cov

# Watch mode
npm run test:watch

# E2E tests (will be added in Script 4)
npm run test:e2e
```

### Coverage Threshold

The project enforces **minimum 80% code coverage** for:
- Branches
- Functions
- Lines
- Statements

---

## 📡 API Endpoints

### REST API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Main health check (includes DB status) |
| `/health/live` | GET | Liveness probe (K8s ready) |
| `/health/ready` | GET | Readiness probe (K8s ready) |
| `/api/docs` | GET | Swagger UI (dev only) |

### GraphQL API

- **Endpoint**: `http://localhost:3000/graphql`
- **Playground**: Available in development mode

**Example Query**:
```graphql
query {
  health {
    status
    version
    timestamp
  }
}
```

### WebSocket

- **Endpoint**: `ws://localhost:3000/ws`
- **Events**:
  - `connected` - Sent on connection
  - `ping` / `pong` - Health check
  - `message` - Echo message

**Example (JavaScript client)**:
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000/ws');

socket.on('connected', (data) => {
  console.log('Connected:', data);
});

socket.emit('ping');
socket.on('pong', (data) => {
  console.log('Pong received:', data);
});
```

---

## 🔒 Security Features

| Feature | Implementation |
|---------|---------------|
| **Helmet.js** | Security headers (CSP, HSTS, etc.) |
| **CORS** | Configurable allowed origins |
| **Validation** | Strict DTO validation with class-validator |
| **Environment Variables** | Joi schema validation on startup |
| **Secrets** | Never hardcoded, always from .env |

---

## 📊 Logging

**Pino Structured Logging** with JSON output:

```json
{
  "level": "info",
  "time": "2025-10-04T12:00:00.000Z",
  "env": "development",
  "app": "SaaS Boilerplate",
  "msg": "Application is running on: http://localhost:3000"
}
```

**Log Levels**:
- `fatal` - Critical errors
- `error` - Errors
- `warn` - Warnings
- `info` - General info (default)
- `debug` - Debug info
- `trace` - Detailed trace

Configure via `LOG_LEVEL` environment variable.

---

## 🛠️ Development Tools

### Linting

```bash
# Check code quality
npm run lint:check

# Fix linting issues
npm run lint
```

### Formatting

```bash
# Format code with Prettier
npm run format
```

---

## 🌍 Multi-Tenant Architecture

**Status**: Prepared (disabled by default)

The architecture is ready for multi-tenancy but not activated in Script 1:
- All MongoDB schemas include optional `tenantId` field
- Middleware extracts tenant context (currently inactive)
- Will be enabled in **Phase 3**

To enable (future):
```env
MULTI_TENANT_ENABLED=true
```

---

## 📈 Monitoring & Health Checks

### Health Check Response

```json
{
  "status": "ok",
  "info": {
    "database": {
      "status": "up"
    }
  },
  "details": {
    "database": {
      "status": "up"
    }
  }
}
```

### Correlation ID Tracking

Every request receives a unique correlation ID for tracing:
```
X-Correlation-ID: 123e4567-e89b-12d3-a456-426614174000
```

This ID is:
- Added to all logs
- Included in error responses
- Returned in response headers

---

## ✅ Validation Checklist (Script 1)

Before moving to Script 2, verify:

### Architecture & Modularity
- [x] Architecture modulaire respectée
- [x] Séparation services/controllers/DTOs
- [x] Code commenté (JSDoc)
- [x] README présent et à jour

### Configuration
- [x] `.env.example` documenté
- [x] Validation Joi fonctionnelle
- [x] ConfigService type-safe

### Database
- [x] MongoDB connexion établie
- [x] Health check DB fonctionnel

### APIs
- [x] REST endpoints opérationnels
- [x] GraphQL Playground accessible
- [x] WebSockets fonctionnels

### Security
- [x] Helmet configuré
- [x] CORS configuré
- [x] Validation pipes activés
- [x] Pas de secrets en dur

### Logging
- [x] Pino configuré (JSON structuré)
- [x] Correlation ID actif
- [x] Niveaux de log appropriés

### Documentation
- [x] Swagger UI accessible (dev)
- [x] README complet
- [x] Commentaires code

### Tests
- [x] Tests unitaires présents
- [x] Coverage >80%
- [x] Tests passent

---

## 🚦 Running Checklist

Test everything works:

```bash
# 1. Application starts without errors
npm run start:dev

# 2. Health check responds
curl http://localhost:3000/health
# Expected: {"status":"ok", ...}

# 3. GraphQL Playground loads
open http://localhost:3000/graphql

# 4. Swagger docs load
open http://localhost:3000/api/docs

# 5. WebSocket connects
# Use socket.io client or Postman

# 6. Tests pass
npm run test:cov
# Expected: All tests pass, coverage >80%

# 7. Linting passes
npm run lint:check
# Expected: No errors
```

---

## 🔄 Next Steps

Once Script 1 is validated, proceed to:

**Script 2 - Common Utilities**:
- Rate limiting middleware
- Advanced exception filters
- Custom decorators
- Guards (placeholders)
- Response transformers

---

## 📞 Support

For questions or issues:
- Check the main [Cahier des Charges](../../CAHIER_DES_CHARGES_SAAS_BOILERPLATE.md)
- Review [Technical Decisions](../../DECISIONS_TECHNIQUES_SYNTHESE.md)

---

**Script 1 Status**: ✅ Complete  
**Next Script**: Script 2 - Common Utilities  
**Generated**: 2025-10-04
