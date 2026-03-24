# Ministros FC - Backend (Nest.js CMS) Dockerfile
# Multi-stage build for optimized production images

# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:23-alpine AS dependencies

WORKDIR /app

# Copy root package files for monorepo
COPY package.json package-lock.json ./

# Copy backend-specific package files
COPY packages/cms/package.json ./packages/cms/package.json
COPY packages/shared/package.json ./packages/shared/package.json

# Install all dependencies
RUN npm ci --verbose

# ============================================
# Stage 2: Builder
# ============================================
FROM node:23-alpine AS builder

WORKDIR /app

# Copy node_modules from dependencies stage
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/packages/*/node_modules ./packages/*/node_modules

# Copy source code
COPY . .

# Build both shared and cms packages
RUN npm run build -w packages/shared
RUN npm run build -w packages/cms

# Generate Prisma client
RUN npm generate -w packages/cms

# ============================================
# Stage 3: Production
# ============================================
FROM node:23-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init curl

# Copy node modules for production only (prune devDependencies)
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/packages/*/node_modules ./packages/*/node_modules

# Copy built application from builder stage
COPY --from=builder /app/packages/cms/dist ./packages/cms/dist
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist

# Copy Prisma schema and migrations
COPY packages/cms/prisma ./packages/cms/prisma
COPY packages/cms/.env* ./packages/cms/
COPY .env* ./

# Copy package files (needed for runtime)
COPY package.json package-lock.json ./
COPY packages/cms/package.json ./packages/cms/package.json
COPY packages/shared/package.json ./packages/shared/package.json

# Create uploads directory
RUN mkdir -p ./packages/cms/uploads && chmod -R 755 ./packages/cms/uploads

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001
USER nestjs

# Expose CMS port
EXPOSE 5102

# Health check
HEALTHCHECK --interval=15s --timeout=5s --retries=5 --start-period=30s \
  CMD curl -f http://localhost:${API_PORT:-5102}/api/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "packages/cms/dist/main.js"]
