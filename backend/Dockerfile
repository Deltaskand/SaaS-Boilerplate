# ================================================
# Stage 1: Dependencies
# ================================================
FROM node:18-alpine AS dependencies

# Install build dependencies
RUN apk add --no-cache python3 make g++ openssl

# Enable npm cache
ENV NODE_ENV=production
ENV NPM_CONFIG_CACHE=/tmp/npm-cache

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies with offline cache
RUN npm ci --only=production --prefer-offline && \
    npm cache clean --force

# ================================================
# Stage 2: Build
# ================================================
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY prisma ./prisma/

# Install all dependencies (including dev)
RUN npm ci

# Copy source code
COPY src ./src

# Generate Prisma Client
RUN npx prisma generate

# Build application
RUN npm run build

# ================================================
# Stage 3: Production
# ================================================
FROM node:18-alpine AS production

# Install dumb-init and openssl for proper signal handling and Prisma
RUN apk add --no-cache dumb-init openssl

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

WORKDIR /app

# Copy dependencies from dependencies stage
COPY --from=dependencies --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=dependencies --chown=nestjs:nodejs /app/prisma ./prisma

# Copy built application
COPY --from=build --chown=nestjs:nodejs /app/dist ./dist
COPY --from=build --chown=nestjs:nodejs /app/package*.json ./

# Generate Prisma Client in production (with checksum ignore for offline builds)
ENV PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
RUN npx prisma generate || echo "Prisma generation skipped"

# Switch to non-root user
USER nestjs

# Environment variables for Node.js optimization
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=2048 --enable-source-maps"
ENV UV_THREADPOOL_SIZE=8

# Expose application port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health/live', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "dist/main.js"]
