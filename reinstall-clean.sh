#!/bin/bash

# Nettoyage complet et réinstallation propre - Script 1

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║    Nettoyage & Réinstallation Propre      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"

# Vérifier qu'on est dans backend/
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Exécutez ce script depuis backend/${NC}"
    exit 1
fi

echo -e "\n${YELLOW}[1/5] Sauvegarde de l'ancien package.json...${NC}"
cp package.json package.json.backup
echo -e "${GREEN}✅ Sauvegarde créée : package.json.backup${NC}"

echo -e "\n${YELLOW}[2/5] Suppression complète de node_modules...${NC}"
rm -rf node_modules package-lock.json
echo -e "${GREEN}✅ Nettoyage complet${NC}"

echo -e "\n${YELLOW}[3/5] Installation du package.json propre...${NC}"

# Créer le nouveau package.json propre
cat > package.json << 'EOFPKG'
{
  "name": "saas-boilerplate-backend",
  "version": "1.0.0",
  "description": "SaaS Boilerplate Backend - NestJS with MongoDB, GraphQL, WebSockets",
  "author": "SaaS Boilerplate Team",
  "private": true,
  "license": "MIT",
  "scripts": {
    "prebuild": "rimraf dist",
    "build": "nest build",
    "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\"",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "lint:check": "eslint \"{src,apps,libs,test}/**/*.ts\"",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
    "test:e2e": "jest --config ./test/jest-e2e.json",
    "test:unit": "jest --testPathIgnorePatterns='.e2e-spec.ts$'"
  },
  "dependencies": {
    "@apollo/server": "^4.10.0",
    "@nestjs/apollo": "^12.1.0",
    "@nestjs/common": "^10.3.0",
    "@nestjs/config": "^3.1.1",
    "@nestjs/core": "^10.3.0",
    "@nestjs/graphql": "^12.1.1",
    "@nestjs/mongoose": "^10.0.2",
    "@nestjs/platform-express": "^10.3.0",
    "@nestjs/platform-socket.io": "^10.3.0",
    "@nestjs/swagger": "^7.2.0",
    "@nestjs/terminus": "^10.2.1",
    "@nestjs/websockets": "^10.3.0",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.1",
    "compression": "^1.7.4",
    "graphql": "^16.8.1",
    "helmet": "^7.1.0",
    "joi": "^17.12.0",
    "mongoose": "^8.1.0",
    "pino": "^8.17.2",
    "pino-http": "^9.0.0",
    "pino-pretty": "^10.3.1",
    "reflect-metadata": "^0.2.1",
    "rimraf": "^5.0.5",
    "rxjs": "^7.8.1",
    "socket.io": "^4.6.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.3.0",
    "@nestjs/schematics": "^10.1.0",
    "@nestjs/testing": "^10.3.0",
    "@types/compression": "^1.7.5",
    "@types/express": "^4.17.21",
    "@types/jest": "^29.5.11",
    "@types/node": "^20.11.0",
    "@types/supertest": "^6.0.2",
    "@typescript-eslint/eslint-plugin": "^6.19.0",
    "@typescript-eslint/parser": "^6.19.0",
    "eslint": "^8.56.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-prettier": "^5.1.3",
    "jest": "^29.7.0",
    "prettier": "^3.2.4",
    "source-map-support": "^0.5.21",
    "supertest": "^6.3.4",
    "ts-jest": "^29.1.1",
    "ts-loader": "^9.5.1",
    "ts-morph": "^21.0.1",
    "ts-node": "^10.9.2",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.3.3"
  },
  "jest": {
    "moduleFileExtensions": [
      "js",
      "json",
      "ts"
    ],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": {
      "^.+\\.(t|j)s$": "ts-jest"
    },
    "collectCoverageFrom": [
      "**/*.(t|j)s"
    ],
    "coverageDirectory": "../coverage",
    "testEnvironment": "node",
    "coveragePathIgnorePatterns": [
      "/node_modules/",
      ".module.ts$",
      "main.ts$"
    ],
    "coverageThreshold": {
      "global": {
        "branches": 80,
        "functions": 80,
        "lines": 80,
        "statements": 80
      }
    }
  }
}
EOFPKG

echo -e "${GREEN}✅ Package.json propre installé${NC}"

echo -e "\n${YELLOW}[4/5] Installation des dépendances (2-3 min)...${NC}"
npm install

echo -e "${GREEN}✅ Dépendances installées${NC}"

echo -e "\n${YELLOW}[5/5] Vérification...${NC}"
npm run build

echo -e "\n${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          ✅ Installation Réussie !         ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"

echo -e "\n${BLUE}Prochaines étapes :${NC}"
echo "1. Démarrer l'app : npm run start:dev"
echo "2. Tester : curl http://localhost:3000/health"
echo ""
echo -e "${YELLOW}Note : L'ancien package.json est sauvegardé dans package.json.backup${NC}"
