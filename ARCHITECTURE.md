# 🏗️ Architecture Overview - SaaS Boilerplate

**Visual Guide to System Architecture**

---

## 📊 Current System Architecture

### High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🌐 Web Browser / Mobile App / API Consumer                    │
│                                                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ HTTPS
                         │ WebSocket (WS/WSS)
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      LOAD BALANCER / CDN                        │
│                     (Production Only)                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API GATEWAY LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │              NestJS Application (Port 3000)            │   │
│  │                                                        │   │
│  │  🛡️  Security Middleware                              │   │
│  │  ├─ Helmet (Security Headers)                         │   │
│  │  ├─ CORS                                              │   │
│  │  ├─ Rate Limiting (Planned)                           │   │
│  │  └─ Compression                                       │   │
│  │                                                        │   │
│  │  📝 Logging & Monitoring                              │   │
│  │  ├─ Pino Logger (Structured JSON)                     │   │
│  │  ├─ Correlation ID Middleware                         │   │
│  │  └─ Exception Filter (Global)                         │   │
│  │                                                        │   │
│  │  ⚡ API Protocols                                      │   │
│  │  ├─ REST API (/api/*)                                 │   │
│  │  ├─ GraphQL (/graphql)                                │   │
│  │  └─ WebSocket (Socket.io)                             │   │
│  │                                                        │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
└────────────────────────┬───────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   MongoDB   │  │    Redis    │  │  External   │
│  (Primary)  │  │  (Planned)  │  │  Services   │
│             │  │             │  │             │
│  Port 27017 │  │  Port 6379  │  │  - Stripe   │
│             │  │             │  │  - SendGrid │
└─────────────┘  └─────────────┘  │  - OAuth    │
                                   └─────────────┘
```

---

## 🔧 Application Layer Architecture

### NestJS Module Structure

```
┌──────────────────────────────────────────────────────────────┐
│                     AppModule (Root)                         │
│                                                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │  Config    │  │  Database  │  │   Health   │           │
│  │  Module    │  │  Module    │  │   Module   │           │
│  │            │  │            │  │            │           │
│  │ ✅ Joi     │  │ ✅ Mongoose│  │ ✅ Terminus│           │
│  │ Validation │  │ Connection │  │ Checks     │           │
│  └────────────┘  └────────────┘  └────────────┘           │
│                                                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │  GraphQL   │  │ WebSocket  │  │   Common   │           │
│  │  Module    │  │  Module    │  │   Module   │           │
│  │            │  │            │  │            │           │
│  │ ✅ Apollo  │  │ ✅ Socket  │  │ ✅ Filters │           │
│  │ Server     │  │ .io        │  │ ✅ Logger  │           │
│  └────────────┘  └────────────┘  └────────────┘           │
│                                                              │
│  ┌─────────────────────────────────────────────┐           │
│  │         Future Modules (Scripts 2-7)        │           │
│  │                                             │           │
│  │  🚧 Auth Module      (Script 4)            │           │
│  │  🚧 Users Module     (Script 3)            │           │
│  │  🚧 Billing Module   (Script 5)            │           │
│  │  🚧 CRM Module       (Script 5)            │           │
│  └─────────────────────────────────────────────┘           │
└──────────────────────────────────────────────────────────────┘
```

---

## 📂 File Structure Visualization

### Current Implementation (Script 1)

```
saas-boilerplate/
│
├── backend/                          ✅ Active Implementation
│   ├── src/
│   │   ├── main.ts                   🚀 Application entry point
│   │   ├── app.module.ts             📦 Root module
│   │   │
│   │   ├── config/                   ⚙️  Configuration Layer
│   │   │   ├── config.module.ts
│   │   │   ├── config.service.ts     📝 168 lines - Type-safe config
│   │   │   └── env.validation.ts     ✅ Joi schema validation
│   │   │
│   │   ├── database/                 🗄️  Database Layer
│   │   │   └── database.module.ts    🔌 Mongoose connection
│   │   │
│   │   ├── health/                   💓 Health Check Layer
│   │   │   ├── health.controller.ts  🏥 3 endpoints (/health, /live, /ready)
│   │   │   └── health.module.ts
│   │   │
│   │   ├── graphql/                  🔷 GraphQL Layer
│   │   │   ├── graphql.module.ts     📊 Apollo Server config
│   │   │   └── base.resolver.ts      🔍 Base resolver
│   │   │
│   │   ├── websocket/                🔌 WebSocket Layer
│   │   │   ├── websocket.module.ts   
│   │   │   └── app.gateway.ts        💬 Socket.io gateway
│   │   │
│   │   └── common/                   🛠️  Common Utilities
│   │       ├── filters/
│   │       │   ├── all-exceptions.filter.ts  🎯 Global error handler
│   │       │   └── http-exception.filter.ts
│   │       └── logger.config.ts      📝 Pino logger setup
│   │
│   ├── test/                         🧪 Testing
│   │   └── e2e/
│   │
│   ├── package.json                  📦 Dependencies (50+ packages)
│   ├── tsconfig.json                 🔧 TypeScript config
│   ├── nest-cli.json                 🏗️  NestJS CLI config
│   └── Dockerfile                    🐳 Container config
│
├── src/                              ⚠️  DUPLICATE - Needs Resolution
│   └── [Similar structure with PostgreSQL/TypeORM]
│
├── monitoring/                       📈 Observability (Planned)
│   └── prometheus.yml
│
├── docker-compose.dev.yml            🐳 Development environment
├── docker-compose.yml                🐳 Production environment
├── package.json                      📦 Root package (needs fixing)
└── README.md                         📚 Documentation
```

---

## 🔄 Request Flow Diagrams

### REST API Request Flow

```
┌──────────┐
│  Client  │
└────┬─────┘
     │
     │ 1. HTTP Request
     │    POST /api/resource
     │
     ▼
┌─────────────────────────────────────┐
│     Middleware Pipeline            │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐  │
│  │ 1. Correlation ID            │  │  Assigns unique request ID
│  │    Middleware                │  │
│  └─────────────────────────────┘  │
│              │                      │
│              ▼                      │
│  ┌─────────────────────────────┐  │
│  │ 2. Security Middleware       │  │  Helmet, CORS
│  │    (Helmet + CORS)           │  │
│  └─────────────────────────────┘  │
│              │                      │
│              ▼                      │
│  ┌─────────────────────────────┐  │
│  │ 3. Validation Pipe           │  │  class-validator
│  │    (Global)                  │  │  DTOs validated
│  └─────────────────────────────┘  │
│              │                      │
│              ▼                      │
│  ┌─────────────────────────────┐  │
│  │ 4. Controller                │  │  Route handler
│  │    (Business Logic)          │  │
│  └─────────────────────────────┘  │
│              │                      │
│              ▼                      │
│  ┌─────────────────────────────┐  │
│  │ 5. Service Layer             │  │  Business logic
│  │    (Database Operations)     │  │
│  └─────────────────────────────┘  │
│              │                      │
│              ▼                      │
│  ┌─────────────────────────────┐  │
│  │ 6. Database                  │  │  MongoDB/Mongoose
│  │    (Mongoose)                │  │
│  └─────────────────────────────┘  │
│                                     │
└─────────────────┬───────────────────┘
                  │
                  │ Response transformed
                  │ and compressed
                  ▼
            ┌──────────┐
            │  Client  │
            └──────────┘
```

### GraphQL Query Flow

```
┌──────────┐
│  Client  │
└────┬─────┘
     │
     │ GraphQL Query
     │ POST /graphql
     │
     ▼
┌─────────────────────────────────┐
│   Apollo Server Middleware      │
├─────────────────────────────────┤
│                                 │
│  1. Parse Query                 │
│  2. Validate Schema             │
│  3. Execute Resolvers           │
│     ┌─────────────┐            │
│     │  Resolver   │─────┐      │
│     │  Chain      │     │      │
│     └─────────────┘     │      │
│           │             │      │
│           ▼             ▼      │
│     ┌─────────┐   ┌─────────┐ │
│     │Service 1│   │Service 2│ │
│     └─────────┘   └─────────┘ │
│           │             │      │
│           ▼             ▼      │
│     ┌─────────────────────┐   │
│     │    MongoDB          │   │
│     └─────────────────────┘   │
│  4. Format Response             │
│                                 │
└─────────────────┬───────────────┘
                  │
                  │ JSON Response
                  ▼
            ┌──────────┐
            │  Client  │
            └──────────┘
```

### WebSocket Connection Flow

```
┌──────────┐
│  Client  │
└────┬─────┘
     │
     │ 1. WebSocket Handshake
     │    ws://localhost:3000
     │
     ▼
┌─────────────────────────────────┐
│   Socket.io Gateway             │
├─────────────────────────────────┤
│                                 │
│  ┌─────────────────────────┐   │
│  │ handleConnection        │   │
│  │  - Validate client      │   │
│  │  - Assign session ID    │   │
│  └─────────────────────────┘   │
│              │                  │
│              ▼                  │
│  ┌─────────────────────────┐   │
│  │ Event Handlers          │   │
│  │  @SubscribeMessage()    │   │
│  │   - handleMessage       │   │
│  │   - handleJoinRoom      │   │
│  └─────────────────────────┘   │
│              │                  │
│              ▼                  │
│  ┌─────────────────────────┐   │
│  │ Emit Events             │   │
│  │  - To specific client   │   │
│  │  - Broadcast to room    │   │
│  │  - Broadcast to all     │   │
│  └─────────────────────────┘   │
│                                 │
└─────────────────┬───────────────┘
                  │
                  │ Real-time events
                  ▼
            ┌──────────┐
            │  Client  │
            └──────────┘
```

---

## 🔐 Security Architecture

### Security Layers

```
┌───────────────────────────────────────────────────────┐
│                  Security Layers                      │
├───────────────────────────────────────────────────────┤
│                                                       │
│  Layer 1: Network Security                           │
│  ┌─────────────────────────────────────────────┐    │
│  │ ✅ HTTPS (TLS 1.3)                          │    │
│  │ ✅ CORS (Origin Whitelisting)               │    │
│  │ 🚧 Rate Limiting (Planned)                  │    │
│  │ 🚧 DDoS Protection (Cloudflare)             │    │
│  └─────────────────────────────────────────────┘    │
│                                                       │
│  Layer 2: Application Security                       │
│  ┌─────────────────────────────────────────────┐    │
│  │ ✅ Helmet (Security Headers)                │    │
│  │   - CSP, HSTS, X-Frame-Options              │    │
│  │ ✅ Input Validation (class-validator)       │    │
│  │   - Whitelist properties                    │    │
│  │   - Forbid non-whitelisted                  │    │
│  │ ✅ Compression (gzip)                       │    │
│  │ 🚧 JWT Authentication (Script 4)            │    │
│  └─────────────────────────────────────────────┘    │
│                                                       │
│  Layer 3: Data Security                              │
│  ┌─────────────────────────────────────────────┐    │
│  │ ✅ Environment Variable Validation          │    │
│  │   - Joi schema validation                   │    │
│  │   - Fail-fast on missing secrets            │    │
│  │ 🚧 Encryption at Rest (MongoDB)             │    │
│  │ 🚧 Argon2id Password Hashing (Script 4)     │    │
│  └─────────────────────────────────────────────┘    │
│                                                       │
│  Layer 4: Operational Security                       │
│  ┌─────────────────────────────────────────────┐    │
│  │ ✅ Structured Logging (Pino)                │    │
│  │   - No sensitive data in logs               │    │
│  │ ✅ Error Handling                           │    │
│  │   - Safe error messages in production       │    │
│  │ ✅ Health Checks                            │    │
│  │ 🚧 Audit Logs (Script 5)                    │    │
│  └─────────────────────────────────────────────┘    │
│                                                       │
└───────────────────────────────────────────────────────┘

Legend:
  ✅ Implemented
  🚧 Planned
```

---

## 📊 Data Flow Architecture

### Configuration Management Flow

```
┌──────────────────────────────────────────────────────┐
│              Application Startup                     │
└────────────────────┬─────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────┐
│  1. Load Environment Variables                       │
│     - .env.local (highest priority)                  │
│     - .env (fallback)                                │
│     - process.env (system environment)               │
└────────────────────┬─────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────┐
│  2. Validate with Joi Schema                         │
│     - Check required variables                       │
│     - Validate formats (URL, number, enum)           │
│     - Apply defaults                                 │
│     - FAIL FAST if validation fails                  │
└────────────────────┬─────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────┐
│  3. ConfigService Initialization                     │
│     - Type-safe getters                              │
│     - Environment detection (dev/prod/test)          │
│     - Parse complex types (arrays, objects)          │
└────────────────────┬─────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────┐
│  4. Inject ConfigService Globally                    │
│     - Available in all modules via DI                │
│     - No need to import ConfigModule                 │
└──────────────────────────────────────────────────────┘
```

### Database Connection Flow

```
┌──────────────────────────────────────────────────────┐
│         Application Bootstrap                        │
└────────────────────┬─────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────┐
│  DatabaseModule.forRootAsync()                       │
│                                                      │
│  1. Inject ConfigService                             │
│  2. Get MongoDB URI from config                      │
│  3. Set connection options:                          │
│     - Connection pooling                             │
│     - Retry logic                                    │
│     - Timeout settings                               │
└────────────────────┬─────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────┐
│  Mongoose Connection Establishment                   │
│                                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │  MongoDB Server (localhost:27017)           │   │
│  │  - Authenticate                              │   │
│  │  - Select database                           │   │
│  │  - Initialize connection pool                │   │
│  └─────────────────────────────────────────────┘   │
└────────────────────┬─────────────────────────────────┘
                     │
                     │ Success ✅
                     ▼
┌──────────────────────────────────────────────────────┐
│  Health Check: Database "up"                         │
│  Application Ready                                   │
└──────────────────────────────────────────────────────┘
                     │
                     │ Failure ❌
                     ▼
┌──────────────────────────────────────────────────────┐
│  Health Check: Database "down"                       │
│  Application in degraded state                       │
│  Return 503 Service Unavailable                      │
└──────────────────────────────────────────────────────┘
```

---

## 🎯 Deployment Architecture (Planned)

### Development Environment

```
┌─────────────────────────────────────────────────┐
│         Developer Workstation                   │
├─────────────────────────────────────────────────┤
│                                                 │
│  🐳 Docker Compose                              │
│  ┌─────────────────────────────────────────┐   │
│  │  Backend Container                      │   │
│  │  - Node.js 18                           │   │
│  │  - Port 3000                            │   │
│  │  - Volume: ./backend/src -> /app/src    │   │
│  │  - Hot reload enabled                   │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │  MongoDB Container                      │   │
│  │  - MongoDB 7                            │   │
│  │  - Port 27017                           │   │
│  │  - Volume: mongodb_data                 │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │  Redis Container (Planned)              │   │
│  │  - Redis 7                              │   │
│  │  - Port 6379                            │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Production Environment (Planned)

```
┌────────────────────────────────────────────────────┐
│              Kubernetes Cluster                    │
├────────────────────────────────────────────────────┤
│                                                    │
│  ┌──────────────────────────────────────────┐    │
│  │  Ingress Controller (NGINX)              │    │
│  │  - SSL/TLS Termination                   │    │
│  │  - Load Balancing                        │    │
│  └──────────────────────────────────────────┘    │
│                    │                              │
│         ┌──────────┴──────────┐                  │
│         ▼                     ▼                   │
│  ┌──────────────┐      ┌──────────────┐         │
│  │  Backend Pod │      │  Backend Pod │         │
│  │  (Replica 1) │      │  (Replica 2) │         │
│  │  - 3 replicas│      │  - Auto-scale│         │
│  │  - Health ✅ │      │  - Health ✅ │         │
│  └──────────────┘      └──────────────┘         │
│         │                     │                   │
│         └──────────┬──────────┘                  │
│                    ▼                              │
│  ┌────────────────────────────────────────┐     │
│  │  MongoDB Atlas / Self-Hosted           │     │
│  │  - Replica Set                         │     │
│  │  - Automatic Backups                   │     │
│  │  - Encryption at Rest                  │     │
│  └────────────────────────────────────────┘     │
│                                                   │
│  ┌────────────────────────────────────────┐     │
│  │  Redis Cluster                         │     │
│  │  - Caching Layer                       │     │
│  │  - Session Storage                     │     │
│  └────────────────────────────────────────┘     │
│                                                   │
│  ┌────────────────────────────────────────┐     │
│  │  Monitoring Stack                      │     │
│  │  - Prometheus                          │     │
│  │  - Grafana                             │     │
│  │  - Alert Manager                       │     │
│  └────────────────────────────────────────┘     │
│                                                   │
└────────────────────────────────────────────────────┘
```

---

## 🔮 Future Architecture (Scripts 2-7)

### Planned Module Additions

```
Current (Script 1)        Future Modules
─────────────────        ────────────────────────────────────

├── Config              ├── Common (Script 2)
├── Database            │   ├── Decorators (@Public, @Roles)
├── Health              │   ├── Guards (JWT, Roles)
├── GraphQL             │   ├── Interceptors (Transform, Cache)
├── WebSocket           │   └── Pipes (Custom validation)
└── Logging             │
                        ├── Users (Script 3)
                        │   ├── User Entity
                        │   ├── CRUD Operations
                        │   ├── GDPR Compliance
                        │   └── Profile Management
                        │
                        ├── Auth (Script 4)
                        │   ├── JWT Strategy
                        │   ├── Refresh Tokens
                        │   ├── OAuth (Google, GitHub)
                        │   └── Password Reset
                        │
                        ├── Billing (Script 5)
                        │   ├── Stripe Integration
                        │   ├── Subscription Plans
                        │   ├── Webhooks
                        │   └── Invoice Management
                        │
                        ├── CRM (Script 5)
                        │   ├── HubSpot Integration
                        │   ├── Contact Sync
                        │   └── Activity Tracking
                        │
                        ├── Frontend (Script 6)
                        │   └── Next.js App
                        │
                        └── Infrastructure (Script 7)
                            ├── Kubernetes Manifests
                            ├── Helm Charts
                            ├── CI/CD Pipelines
                            └── Terraform
```

---

## 📈 Scalability Considerations

### Horizontal Scaling Strategy

```
Single Instance (Development)
┌────────────────┐
│   Backend      │
│   Port 3000    │
└────────────────┘
        │
        ▼
┌────────────────┐
│   MongoDB      │
└────────────────┘

                ↓ Scale Up ↓

Multi-Instance (Production)
┌────────────────┐  ┌────────────────┐  ┌────────────────┐
│   Backend 1    │  │   Backend 2    │  │   Backend N    │
│   Port 3000    │  │   Port 3000    │  │   Port 3000    │
└────────────────┘  └────────────────┘  └────────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            ▼
                  ┌──────────────────┐
                  │  Load Balancer   │
                  └──────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌────────────────┐  ┌────────────────┐  ┌────────────────┐
│  MongoDB       │  │     Redis      │  │   Message      │
│  Replica Set   │  │   Cluster      │  │   Queue        │
│  (Primary +    │  │  (Cache)       │  │   (Bull)       │
│   Secondaries) │  │                │  │                │
└────────────────┘  └────────────────┘  └────────────────┘
```

---

## 📚 Related Documentation

- **CODE_REVIEW_HIGH_LEVEL.md** - Detailed code review and analysis
- **ACTION_ITEMS.md** - Prioritized action items and fixes
- **README.md** - Project overview and setup instructions
- **backend/README.md** - Backend-specific documentation

---

**Last Updated**: 2024  
**Architecture Version**: 1.0 (Script 1)
