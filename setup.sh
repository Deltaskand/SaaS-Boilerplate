#!/bin/bash

# ==============================================
# SaaS Boilerplate - Script d'Installation Automatique
# ==============================================
# Ce script automatise les étapes 1-6 du guide
# ==============================================

set -e  # Arrêter si erreur

# Couleurs pour les messages
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════╗"
echo "║   SaaS Boilerplate - Installation Auto    ║"
echo "║              Script 1 - Core               ║"
echo "╚════════════════════════════════════════════╝"
echo -e "${NC}"

# ==============================================
# Étape 1 : Vérification des Prérequis
# ==============================================
echo -e "${YELLOW}[1/6] Vérification des prérequis...${NC}"

# Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js n'est pas installé${NC}"
    echo "Installer Node.js 18+ depuis https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version $NODE_VERSION détectée. Version 18+ requise.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node -v) détecté${NC}"

# npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm n'est pas installé${NC}"
    exit 1
fi

echo -e "${GREEN}✅ npm $(npm -v) détecté${NC}"

# Git
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git n'est pas installé${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Git $(git --version | cut -d' ' -f3) détecté${NC}"

# Docker (optionnel mais recommandé)
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✅ Docker $(docker --version | cut -d' ' -f3 | cut -d',' -f1) détecté${NC}"
    DOCKER_AVAILABLE=true
else
    echo -e "${YELLOW}⚠️  Docker non détecté (recommandé pour MongoDB)${NC}"
    DOCKER_AVAILABLE=false
fi

# ==============================================
# Étape 2 : Navigation vers backend
# ==============================================
echo -e "\n${YELLOW}[2/6] Navigation vers le dossier backend...${NC}"

if [ ! -d "backend" ]; then
    echo -e "${RED}❌ Dossier backend/ non trouvé${NC}"
    echo "Exécutez ce script depuis la racine du projet saas-boilerplate/"
    exit 1
fi

cd backend
echo -e "${GREEN}✅ Dans backend/${NC}"

# ==============================================
# Étape 3 : Installation des dépendances
# ==============================================
echo -e "\n${YELLOW}[3/6] Installation des dépendances npm...${NC}"
echo "Cela peut prendre 2-3 minutes..."

npm install

echo -e "${GREEN}✅ Dépendances installées${NC}"

# ==============================================
# Étape 4 : Configuration .env
# ==============================================
echo -e "\n${YELLOW}[4/6] Configuration .env...${NC}"

if [ ! -f ".env" ]; then
    if [ -f ".env.local" ]; then
        cp .env.local .env
        echo -e "${GREEN}✅ .env créé depuis .env.local${NC}"
    else
        echo -e "${RED}❌ Aucun fichier .env.local trouvé${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ .env existe déjà${NC}"
fi

# ==============================================
# Étape 5 : Démarrage MongoDB
# ==============================================
echo -e "\n${YELLOW}[5/6] Démarrage MongoDB...${NC}"

if [ "$DOCKER_AVAILABLE" = true ]; then
    # Vérifier si container existe
    if docker ps -a | grep -q mongodb-saas; then
        echo "Container mongodb-saas existe déjà"
        # Démarrer si arrêté
        if ! docker ps | grep -q mongodb-saas; then
            docker start mongodb-saas
            echo -e "${GREEN}✅ MongoDB démarré (container existant)${NC}"
        else
            echo -e "${GREEN}✅ MongoDB déjà en cours d'exécution${NC}"
        fi
    else
        # Créer nouveau container
        docker run -d \
            --name mongodb-saas \
            -p 27017:27017 \
            -v mongodb_data:/data/db \
            mongo:latest
        echo -e "${GREEN}✅ MongoDB démarré (nouveau container)${NC}"
    fi
    
    # Attendre que MongoDB soit prêt
    echo "Attente démarrage MongoDB..."
    sleep 3
else
    echo -e "${YELLOW}⚠️  Docker non disponible${NC}"
    echo "Assurez-vous que MongoDB tourne localement sur port 27017"
    read -p "MongoDB est-il démarré ? (o/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[OoYy]$ ]]; then
        echo -e "${RED}Veuillez démarrer MongoDB et relancer ce script${NC}"
        exit 1
    fi
fi

# ==============================================
# Étape 6 : Tests
# ==============================================
echo -e "\n${YELLOW}[6/6] Exécution des tests...${NC}"

npm run test:cov

echo -e "${GREEN}✅ Tests passés${NC}"

# ==============================================
# Résumé Final
# ==============================================
echo -e "\n${GREEN}"
echo "╔════════════════════════════════════════════╗"
echo "║          ✅ Installation Réussie !         ║"
echo "╚════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${BLUE}Pour démarrer l'application :${NC}"
echo "  npm run start:dev"
echo ""
echo -e "${BLUE}Endpoints disponibles :${NC}"
echo "  REST       : http://localhost:3000/health"
echo "  GraphQL    : http://localhost:3000/graphql"
echo "  Swagger    : http://localhost:3000/api/docs"
echo "  WebSocket  : ws://localhost:3000/ws"
echo ""
echo -e "${BLUE}Commandes utiles :${NC}"
echo "  npm run start:dev     - Démarrer en mode dev"
echo "  npm run test:cov      - Lancer les tests"
echo "  npm run lint:check    - Vérifier le code"
echo ""
echo -e "${YELLOW}Prochaines étapes :${NC}"
echo "  1. Démarrer l'app : npm run start:dev"
echo "  2. Tester : curl http://localhost:3000/health"
echo "  3. Pousser sur Git (voir GUIDE_INSTALLATION_COMPLETE.md)"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"
