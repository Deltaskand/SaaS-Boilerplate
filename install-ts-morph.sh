#!/bin/bash

# Installation de ts-morph (dépendance GraphQL)

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Installation de ts-morph...${NC}"

npm install ts-morph --save-dev

echo -e "${GREEN}✅ ts-morph installé${NC}"

echo -e "\n${YELLOW}Relancer l'application...${NC}"
npm run start:dev
