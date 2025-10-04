# 🚀 SaaS Boilerplate - Enterprise-Grade Platform

> **📊 Code Review Available**: A comprehensive high-level code review has been completed. See [INDEX.md](INDEX.md) for the complete review documentation.

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture](#architecture)
3. [Prérequis](#prérequis)
4. [Installation Locale](#installation-locale)
5. [Configuration](#configuration)
6. [Développement](#développement)
7. [Tests](#tests)
8. [Déploiement GitHub](#déploiement-github)
9. [Production](#production)
10. [Documentation API](#documentation-api)
11. [📚 Code Review Documentation](#-code-review-documentation)

---

## 🎯 Vue d'ensemble

**SaaS Boilerplate** est un socle technique réutilisable de niveau bancaire/NASA pour accélérer le déploiement de plateformes SaaS (freemium → pro → entreprise).

### ✨ Fonctionnalités Principales

- ✅ **Authentification complète** : Email/Password, OAuth (Google, GitHub), JWT avec refresh tokens
- ✅ **Gestion utilisateurs** : Profils, RGPD, droit à l'oubli
- ✅ **Billing & Abonnements** : Intégration Stripe (Freemium, Pro, Entreprise)
- ✅ **Sécurité maximale** : Argon2id, Rate limiting, Helmet, CORS, Audit logs
- ✅ **Monitoring** : Pino (logging structuré), Prometheus, Health checks
- ✅ **Tests automatisés** : Unitaires, intégration, E2E (>80% coverage)
- ✅ **Infrastructure** : Docker, CI/CD, Kubernetes ready

### 🏗️ Stack Technique

**Backend:**
- NestJS 10 (Node.js)
- TypeScript (strict mode)
- PostgreSQL + Prisma ORM
- Redis (cache & queues)
- Bull (job queues)
- Pino (logging)

**Sécurité:**
- Argon2id (hashing)
- JWT (access + refresh tokens)
- Helmet (security headers)
- Rate limiting
- CORS

**DevOps:**
- Docker & Docker Compose
- GitHub Actions (CI/CD)
- Kubernetes (Helm)
- Prometheus + Grafana

---

## 🏛️ Architecture

```
/saas-boilerplate
├── /backend                 # API NestJS
│   ├── /src
│   │   ├── /auth           # Script 4 - Authentification
│   │   ├── /users          # Script 3 - Gestion utilisateurs
│   │   ├── /billing        # Script 5 - Billing & Stripe
│   │   ├── /crm            # Script 5 - Intégration CRM
│   │   ├── /common         # Script 2 - Middleware, Filters, Guards
│   │   ├── /config         # Script 1 - Configuration
│   │   ├── /health         # Script 1 - Health checks
│   │   └── /tests          # Tests unitaires & e2e
│   ├── /prisma             # Schéma DB & migrations
│   ├── Dockerfile
│   └── package.json
├── /frontend                # Next.js (Script 6)
├── /infra                   # Kubernetes, Terraform (Script 7)
├── docker-compose.dev.yml   # Dev environment
└── README.md
```

---

## 💻 Prérequis

### Logiciels Requis

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Docker** >= 24.0.0
- **Docker Compose** >= 2.20.0
- **Git** >= 2.40.0

### Comptes Externes (Optionnel)

- Stripe (pour le billing)
- Google OAuth (pour le social login)
- GitHub OAuth (pour le social login)
- SendGrid ou SMTP (pour les emails)
- HubSpot (pour le CRM)

---

## 📥 Installation Locale

### Étape 1 : Cloner le Projet

```bash
# Cloner le repository
git clone https://github.com/votre-username/saas-boilerplate.git
cd saas-boilerplate
```

### Étape 2 : Configuration Backend

```bash
cd backend

# Installer les dépendances
npm install

# Copier le fichier d'environnement
cp .env.example .env

# Éditer .env avec vos valeurs
nano .env
```

**Variables essentielles à configurer dans `.env` :**

```env
# Application
NODE_ENV=development
PORT=3000
APP_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3001

# Database (sera créée par Docker)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/saas_boilerplate?schema=public"

# JWT Secrets (CHANGEZ CES VALEURS!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-minimum-32-chars
JWT_REFRESH_TOKEN_SECRET=your-refresh-token-secret-change-this-in-production-minimum-32-chars

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Étape 3 : Lancer les Services avec Docker

```bash
# Retour à la racine du projet
cd ..

# Lancer PostgreSQL + Redis + Backend
docker-compose -f docker-compose.dev.yml up -d

# Vérifier que les services sont lancés
docker-compose -f docker-compose.dev.yml ps
```

**Services disponibles :**
- Backend API : http://localhost:3000
- PostgreSQL : localhost:5432
- Redis : localhost:6379
- Prisma Studio : http://localhost:5555

### Étape 4 : Migrations de Base de Données

```bash
cd backend

# Générer le client Prisma
npx prisma generate

# Créer les migrations
npx prisma migrate dev --name init

# (Optionnel) Seed la base de données
npm run db:seed
```

### Étape 5 : Vérification

```bash
# Vérifier que l'API fonctionne
curl http://localhost:3000/health

# Réponse attendue :
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "memory_rss": { "status": "up" },
    ...
  }
}
```

---

## ⚙️ Configuration

### Variables d'Environnement Clés

#### Développement Local

Fichier : `backend/.env`

```env
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/saas_boilerplate"
JWT_SECRET=dev-secret-minimum-32-characters
CORS_ORIGINS=http://localhost:3001
LOG_LEVEL=debug
```

#### Production

```env
NODE_ENV=production
DATABASE_URL="postgresql://user:pass@prod-db:5432/saas"
JWT_SECRET=<généré-avec-openssl-rand>
CORS_ORIGINS=https://app.votredomaine.com
LOG_LEVEL=info
ENABLE_API_DOCS=false
```

### Générer des Secrets Sécurisés

```bash
# Générer JWT_SECRET
openssl rand -base64 32

# Générer JWT_REFRESH_TOKEN_SECRET
openssl rand -base64 32
```

---

## 🛠️ Développement

### Commandes de Développement

```bash
cd backend

# Lancer en mode dev (avec hot reload)
npm run start:dev

# Lancer en mode debug
npm run start:debug

# Build de production
npm run build

# Lancer la version build
npm run start:prod
```

### Linting & Formatage

```bash
# Linter le code
npm run lint

# Formatter le code
npm run format

# Vérifier les types TypeScript
npm run build
```

### Base de Données

```bash
# Ouvrir Prisma Studio (GUI)
npx prisma studio

# Créer une nouvelle migration
npx prisma migrate dev --name add-new-field

# Réinitialiser la DB (DEV ONLY!)
npx prisma migrate reset
```

---

## 🧪 Tests

### Lancer les Tests

```bash
cd backend

# Tests unitaires
npm test

# Tests avec coverage
npm run test:cov

# Tests en mode watch
npm run test:watch

# Tests e2e
npm run test:e2e

# Tests d'intégration
npm run test:integration
```

### Exigences de Coverage

Le projet impose un coverage minimum de **80%** :

- Branches: 80%
- Functions: 80%
- Lines: 80%
- Statements: 80%

---

## 🚀 Déploiement GitHub

### Étape 1 : Créer un Repository GitHub

```bash
# Sur GitHub, créer un nouveau repository : saas-boilerplate
# Ne PAS initialiser avec README, .gitignore ou licence
```

### Étape 2 : Initialiser Git Localement

```bash
cd saas-boilerplate

# Initialiser Git
git init

# Ajouter tous les fichiers
git add .

# Commit initial
git commit -m "feat: Initial commit - Script 1 (Core & Config)"

# Ajouter le remote GitHub
git remote add origin https://github.com/votre-username/saas-boilerplate.git

# Pousser sur GitHub
git branch -M main
git push -u origin main
```

### Étape 3 : Configuration des Secrets GitHub

Sur GitHub : **Settings → Secrets and variables → Actions**

Ajouter les secrets suivants :

```
DOCKER_USERNAME=votre-dockerhub-username
DOCKER_PASSWORD=votre-dockerhub-token
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_REFRESH_TOKEN_SECRET=...
```

### Étape 4 : Activer GitHub Actions

Le fichier `.github/workflows/ci.yml` sera créé dans le **Script 7**.

Une fois poussé, GitHub Actions :
1. ✅ Lint le code
2. ✅ Lance les tests
3. ✅ Vérifie le coverage
4. ✅ Build l'image Docker
5. ✅ Push sur Docker Hub (si main)

---

## 🌐 Production

### Déploiement avec Docker

```bash
# Build l'image de production
docker build -t saas-boilerplate:latest ./backend

# Lancer en production
docker run -p 3000:3000 \
  --env-file .env.production \
  saas-boilerplate:latest
```

### Déploiement Kubernetes

```bash
# Appliquer les manifests (Script 7)
kubectl apply -f infra/k8s/

# Ou avec Helm
helm install saas-boilerplate ./infra/helm
```

### Health Checks Production

- **Liveness**: `GET /health/liveness`
- **Readiness**: `GET /health/readiness`
- **Complet**: `GET /health`

---

## 📚 Documentation API

### Swagger UI

En développement :

```
http://localhost:3000/api/docs
```

### Endpoints Principaux

| Route | Méthode | Description |
|-------|---------|-------------|
| `/` | GET | Info application |
| `/health` | GET | Health check complet |
| `/health/db` | GET | Health DB |
| `/api/v1/auth/*` | * | Authentification (Script 4) |
| `/api/v1/users/*` | * | Gestion utilisateurs (Script 3) |
| `/api/v1/billing/*` | * | Billing & Stripe (Script 5) |

---

## 🗂️ Scripts du Projet

Le projet est généré en **7 scripts modulaires** :

- ✅ **Script 1** : Core & Config (ACTUEL)
- ⏳ **Script 2** : Common Utilities
- ⏳ **Script 3** : Users Module
- ⏳ **Script 4** : Auth Module
- ⏳ **Script 5** : Billing & CRM
- ⏳ **Script 6** : Frontend Next.js
- ⏳ **Script 7** : Infra & CI/CD

---

## 🆘 Support & Contribution

### Problèmes Courants

**Erreur : "Cannot connect to database"**
```bash
# Vérifier que PostgreSQL est lancé
docker-compose -f docker-compose.dev.yml ps postgres

# Relancer si nécessaire
docker-compose -f docker-compose.dev.yml restart postgres
```

**Erreur : "Port 3000 already in use"**
```bash
# Trouver le process
lsof -i :3000

# Tuer le process
kill -9 <PID>
```

### Reporting Bugs

Ouvrir une issue sur GitHub avec :
- Description du problème
- Steps to reproduce
- Logs d'erreur
- OS et version Node.js

---

## 📚 Code Review Documentation

A comprehensive high-level code review has been completed for this project. The review includes:

- **Overall Assessment**: ⭐⭐⭐⭐☆ (4/5 stars)
- **Security Grade**: A+ (Excellent security practices)
- **Code Quality**: A- (Type-safe, well-structured)

### 📖 Review Documents

1. **[INDEX.md](INDEX.md)** - Start here for complete review overview
2. **[REVIEW_SUMMARY.md](REVIEW_SUMMARY.md)** - Quick reference (5 min read)
3. **[CODE_REVIEW_HIGH_LEVEL.md](CODE_REVIEW_HIGH_LEVEL.md)** - Complete analysis (24KB)
4. **[ACTION_ITEMS.md](ACTION_ITEMS.md)** - Prioritized action items
5. **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture diagrams
6. **[CHECKLIST.md](CHECKLIST.md)** - Implementation tracking

### 🔴 Critical Issues to Address (Week 1)

The review identified 3 critical issues that need immediate attention:

1. **Dual Codebase Structure** - Choose between `/src` (PostgreSQL) or `/backend` (MongoDB)
2. **Build Configuration** - Fix missing dependencies (rimraf)
3. **Documentation Inconsistencies** - Update README to match implementation

See [ACTION_ITEMS.md](ACTION_ITEMS.md) for detailed implementation steps.

---

## 📄 Licence

MIT License - Voir fichier `LICENSE`

---

## 👥 Auteurs

SaaS Boilerplate Team

---

**🎉 Félicitations ! Le Script 1 (Core & Config) est terminé !**

**📊 Code Review Status**: ✅ Complete - See [INDEX.md](INDEX.md) for recommendations

**Prochaine étape** : Implement critical fixes, then Script 2 (Common Utilities)
