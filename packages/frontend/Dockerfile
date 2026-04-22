# Ministros FC - Frontend (Nuxt 4) Dockerfile
# Multi-stage build for optimized production images

# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:23-alpine AS dependencies

WORKDIR /app

# Copy root package files for monorepo
COPY package.json package-lock.json ./

# Copy frontend-specific and shared package files
COPY packages/frontend/package.json ./packages/frontend/package.json
COPY packages/shared/package.json ./packages/shared/package.json

# Install all dependencies
RUN npm ci --verbose

# ============================================
# Stage 2: Builder
# ============================================
FROM node:23-alpine AS builder

WORKDIR /app

ARG NODE_ENV=production
ARG API_URL=http://backend:5102/api
ARG API_URL_PUBLIC=http://localhost:5102/api

ENV NODE_ENV=$NODE_ENV
ENV API_URL=$API_URL
ENV API_URL_PUBLIC=$API_URL_PUBLIC

# Copy node_modules from dependencies stage
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/packages/frontend/node_modules ./packages/frontend/node_modules

# Copy source code
COPY . .

# Build shared package
RUN npm run build -w packages/shared

# Build frontend (Nuxt build)
RUN npm run build -w packages/frontend

# ============================================
# Stage 3: Production
# ============================================
FROM node:23-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Install dumb-init for proper signal handling and curl for health checks
RUN apk add --no-cache dumb-init curl

# Copy node_modules for production (production dependencies only)
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/packages/frontend/node_modules ./packages/frontend/node_modules

# Copy built application from builder stage
COPY --from=builder /app/packages/frontend/.output ./packages/frontend/.output
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist

# Copy source and public files needed at runtime
COPY packages/frontend/public ./packages/frontend/public
COPY packages/frontend/nuxt.config.ts ./packages/frontend/
COPY packages/frontend/package.json ./packages/frontend/package.json

# Copy root package files
COPY package.json package-lock.json ./
COPY .env* ./

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nuxtjs -u 1001
USER nuxtjs

# Health check (deploy runtime defaults to 3000; local dev still uses 5103)
HEALTHCHECK --interval=15s --timeout=5s --retries=5 --start-period=30s \
  CMD curl -f http://localhost:${APP_PORT:-3000}/ || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Expose deployed Nuxt port
EXPOSE 3000

# Start Nuxt application
CMD ["node", "packages/frontend/.output/server/index.mjs"]
