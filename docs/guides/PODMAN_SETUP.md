# Ministros FC - PODMAN Setup Guide

Complete guide to running Ministros FC with PODMAN containerization.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Services Overview](#services-overview)
4. [Configuration](#configuration)
5. [Running Services](#running-services)
6. [Troubleshooting](#troubleshooting)
7. [Production Deployment](#production-deployment)
8. [Development Workflow](#development-workflow)

---

## Prerequisites

### System Requirements

- **PODMAN** 3.0+ (installation varies by OS)
- **PODMAN Compose** (for orchestration)
- **Git** (for cloning repository)
- 4GB RAM minimum, 2 CPU cores minimum
- 10GB disk space

### Install PODMAN

**macOS** (Homebrew):

```bash
brew install podman podman-compose
podman machine init
podman machine start
```

**Linux** (Ubuntu/Debian):

```bash
sudo apt-get update
sudo apt-get install -y podman podman-compose
# Enable socket for non-root access (optional)
systemctl --user enable podman.socket
```

**Windows** (WSL2 + Podman):

```bash
# Install WSL2 if not already installed
# Then in WSL2:
sudo apt-get update
sudo apt-get install -y podman podman-compose
```

**macOS/Windows** - Alternative: Use Podman Desktop GUI

- Download from https://podman.io/docs/installation

---

## Quick Start

### 1. Clone and Setup Repository

```bash
git clone <repository-url> ministrosfc
cd ministrosfc

# Copy environment template
cp .env.example .env

# Edit .env if needed for custom configuration
nano .env
```

### 2. Start All Services

```bash
# Using podman-compose (recommended for compatibility)
podman-compose -f docker-compose.yml up -d

# Or using newer podman compose (syntax varies)
podman compose -f docker-compose.yml up -d
```

### 3. Verify Services are Running

```bash
podman-compose ps
# or
podman container list

# Expected output:
# STATUS: Up (Healthy) for all 5 services
```

### 4. Access Applications

| Service         | URL                            | Purpose                    |
| --------------- | ------------------------------ | -------------------------- |
| **Frontend**    | http://localhost:3000          | Public team website        |
| **Backend API** | http://localhost:3001/api      | CMS Admin API              |
| **API Docs**    | http://localhost:3001/api/docs | Swagger UI (if enabled)    |
| **Database**    | localhost:5432                 | PostgreSQL (internal only) |
| **Redis**       | localhost:6379                 | Cache (internal only)      |

### 5. Initialize Database

```bash
# Run Prisma migrations
podman exec ministrosfc-backend npm run prisma:migrate

# Optional: Seed database with sample data
podman exec ministrosfc-backend npm run prisma:seed
```

### 6. Stop All Services

```bash
podman-compose down

# Remove volumes (⚠️ CAUTION: deletes all data)
podman-compose down -v
```

---

## Services Overview

### 1. PostgreSQL Database (`db`)

- **Image**: `postgres:15-alpine`
- **Container**: `ministrosfc-postgres`
- **Port**: 5432 (internal only, exposed for development)
- **Volume**: `postgres_data` (persists database)
- **Startup**: ~5 seconds
- **Health Check**: pg_isready command

**Access**:

```bash
# Using psql inside container
podman exec -it ministrosfc-postgres psql -U ministros_user -d ministrosfc

# Or from host (if psql installed)
psql -h localhost -U ministros_user -d ministrosfc
```

### 2. Redis Cache (`redis`)

- **Image**: `redis:7-alpine`
- **Container**: `ministrosfc-redis`
- **Port**: 6379 (internal use, can expose for debugging)
- **Volume**: `redis_data` (persists cache)
- **Startup**: ~2 seconds
- **Auth**: Requires password (set in .env)

**Access**:

```bash
# Connect with redis-cli (inside container)
podman exec -it ministrosfc-redis redis-cli -a <REDIS_PASSWORD>
> PING
PONG
```

### 3. Nest.js Backend / CMS (`backend`)

- **Image**: Built from `packages/cms/Dockerfile`
- **Container**: `ministrosfc-backend`
- **Port**: 3001
- **Framework**: Nest.js + Express adapter
- **Dependencies**: Requires `db` and `redis` healthy
- **Volume**: Watches `packages/cms/src` for hot-reload (development)

**Key Endpoints**:

- `GET /api/health` — Health check
- `POST /api/auth/login` — User authentication
- `GET /api/players` — List players
- `GET /api/games` — List games
- See [API Contracts](./specs/001-ministrosfc-monorepo/contracts/) for full API

**Access Backend Logs**:

```bash
podman logs -f ministrosfc-backend

# Live logs with timestamps
podman logs -f --timestamps ministrosfc-backend

# Last 100 lines
podman logs --tail 100 ministrosfc-backend
```

**Shell Access** (for debugging):

```bash
podman exec -it ministrosfc-backend sh

# Inside container:
# npm run start:dev    (development with hot-reload)
# npm run start:debug  (debug mode)
# npm run test         (run tests)
```

### 4. Nuxt 4 Frontend (`frontend`)

- **Image**: Built from `packages/frontend/Dockerfile`
- **Container**: `ministrosfc-frontend`
- **Port**: 3000
- **Framework**: Nuxt 4 + Vue 3
- **SSR**: Server-Side Rendering enabled
- **Dependencies**: Requires `backend` healthy
- **Volume**: Watches source for hot-reload (development)

**Access Frontend**:

- Browse to http://localhost:3000
- Public routes require no authentication
- Admin/Editor routes redirect to login

**Access Frontend Logs**:

```bash
podman logs -f ministrosfc-frontend
```

**Shell Access**:

```bash
podman exec -it ministrosfc-frontend sh

# Inside container:
# npm run dev   (development with hot-reload)
# npm run build (production build)
# npm run test  (run E2E tests)
```

---

## Configuration

### Environment Variables

All configuration is managed via `.env` file (copy from `.env.example`).

**Key Variables**:

```env
# Database
DATABASE_URL=postgresql://user:password@db:5432/ministrosfc
DB_PASSWORD=strong_password_here

# Redis
REDIS_PASSWORD=redis_password_here

# JWT Security (CHANGE IN PRODUCTION)
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRATION=24h

# API URLs
API_URL=http://backend:3001/api                           (internal)
API_URL_PUBLIC=http://localhost:3001/api                  (external)
PUBLIC_URL=http://localhost:3000                          (frontend URL)

# CORS
CORS_ORIGIN=http://localhost:3000,http://frontend:3000

# Logging
API_LOG_LEVEL=debug  (development) or info (production)
```

### Service Ports

| Service    | Internal Port | Host Port | Access                         |
| ---------- | ------------- | --------- | ------------------------------ |
| Frontend   | 3000          | 3000      | Public (http://localhost:3000) |
| Backend    | 3001          | 3001      | Public (http://localhost:3001) |
| PostgreSQL | 5432          | 5432      | Development only               |
| Redis      | 6379          | 6379      | Development only               |

**Change Ports**: Edit `.env` file (e.g., `API_PORT=8080`)

---

## Running Services

### Start Services

```bash
# Start all services in background (-d = detached)
podman-compose up -d

# View startup progress (follow logs)
podman-compose logs -f

# Start specific services only
podman-compose up -d db redis
podman-compose up -d backend
podman-compose up -d frontend
```

### Monitor Services

```bash
# List running containers
podman-compose ps

# View container status and health
podman ps --format "table {{.Names}}\t{{.Status}}"

# Monitor resource usage
podman stats

# Check specific service logs
podman logs -f ministrosfc-backend
podman logs -f ministrosfc-frontend
podman logs -f ministrosfc-postgres
```

### Stop Services

```bash
# Stop all services (data persists)
podman-compose stop

# Stop specific service
podman-compose stop backend

# Stop and remove containers (data persists in volumes)
podman-compose down

# Stop and delete everything (⚠️ DELETES DATA)
podman-compose down -v
```

### Restart Services

```bash
# Restart all services
podman-compose restart

# Restart specific service
podman-compose restart backend

# Force rebuild and restart
podman-compose up -d --build
```

---

## Database Operations

### Run Migrations

```bash
# Create new migration
podman exec ministrosfc-backend npx prisma migrate dev --name <migration-name>

# Apply pending migrations
podman exec ministrosfc-backend npm run prisma:migrate

# Reset database (⚠️ REMOVES ALL DATA)
podman exec ministrosfc-backend npx prisma migrate reset
```

### Access Database Directly

```bash
# Interactive PostgreSQL shell
podman exec -it ministrosfc-postgres psql -U ministros_user -d ministrosfc

# Execute single query
podman exec ministrosfc-postgres psql -U ministros_user -d ministrosfc -c "SELECT * FROM users;"

# Backup database
podman exec ministrosfc-postgres pg_dump -U ministros_user ministrosfc > backup.sql

# Restore database
cat backup.sql | podman exec -i ministrosfc-postgres psql -U ministros_user -d ministrosfc
```

---

## Troubleshooting

### Services Won't Start

**Check service logs**:

```bash
podman-compose logs
```

**Common Issues**:

1. **Port Already in Use**

   ```bash
   # Check what's using the port
   lsof -i :3000
   lsof -i :3001
   lsof -i :5432

   # Kill process or change port in .env
   ```

2. **PODMAN Daemon Not Running**

   ```bash
   # macOS: Start PODMAN machine
   podman machine start

   # Linux: Ensure podman socket is running
   systemctl --user start podman.socket
   ```

3. **Out of Disk Space**
   ```bash
   # Clean up PODMAN resources
   podman system prune -a
   ```

### Database Connection Errors

```bash
# Verify database is running
podman ps | grep postgres

# Check database logs
podman logs ministrosfc-postgres

# Test connection
podman exec ministrosfc-postgres psql -U ministros_user -c "SELECT 1"
```

### Backend API Not Responding

```bash
# Check backend logs
podman logs -f ministrosfc-backend

# Verify dependencies (DB, Redis) are healthy
podman-compose ps

# Restart backend
podman-compose restart backend

# Full rebuild
podman-compose up -d --build backend
```

### Frontend Not Loading

```bash
# Check frontend logs
podman logs -f ministrosfc-frontend

# Verify API connectivity
curl http://localhost:3001/api/health

# Clear frontend cache (build new image)
podman-compose build --no-cache frontend
podman-compose up -d frontend
```

### Network Issues Between Services

```bash
# Verify network exists
podman network ls

# Inspect network
podman network inspect ministrosfc_ministrosfc-network

# Test internal connectivity
podman exec ministrosfc-backend ping -c 1 redis
podman exec ministrosfc-backend ping -c 1 db
```

---

## Production Deployment

### Pre-Production Checklist

- [ ] Set strong `JWT_SECRET` (min 32 random characters)
- [ ] Set strong `DB_PASSWORD` and `REDIS_PASSWORD`
- [ ] Set `NODE_ENV=production`
- [ ] Change `API_LOG_LEVEL=info`
- [ ] Use external PostgreSQL (not containerized)
- [ ] Use external Redis (Redis Cloud, AWS ElastiCache, etc.)
- [ ] Set proper `CORS_ORIGIN` (your domain only)
- [ ] Enable HTTPS/TLS (via reverse proxy: Nginx, Caddy)
- [ ] Set up proper backups for database
- [ ] Configure security headers
- [ ] Set up monitoring and alerting

### Production docker-compose

Create `docker-compose.prod.yml`:

```yaml
version: "3.9"

services:
  backend:
    image: your-registry/ministrosfc-backend:latest
    environment:
      NODE_ENV: production
      DATABASE_URL: <external-postgresql-url>
      REDIS_URL: <external-redis-url>
      JWT_SECRET: <strong-random-secret>
      CORS_ORIGIN: https://yourdomain.com
    restart: always
    ports:
      - "3001:3001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    image: your-registry/ministrosfc-frontend:latest
    environment:
      NODE_ENV: production
      API_URL: https://api.yourdomain.com/api
      API_URL_PUBLIC: https://api.yourdomain.com/api
      PUBLIC_URL: https://yourdomain.com
    restart: always
    ports:
      - "3000:3000"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/"]
      interval: 30s
      timeout: 10s
      retries: 3
```

**Run production**:

```bash
podman-compose -f docker-compose.prod.yml up -d
```

### Reverse Proxy Setup (Nginx)

Set up HTTPS and proxy requests to services:

```nginx
# /etc/nginx/conf.d/ministrosfc.conf

upstream backend {
  server localhost:3001;
}

upstream frontend {
  server localhost:3000;
}

server {
  listen 443 ssl http2;
  server_name yourdomain.com api.yourdomain.com;

  ssl_certificate /etc/ssl/certs/your-cert.crt;
  ssl_certificate_key /etc/ssl/private/your-key.key;

  # Frontend
  location / {
    proxy_pass http://frontend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }

  # API
  location /api/ {
    proxy_pass http://backend/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
}

# Redirect HTTP to HTTPS
server {
  listen 80;
  server_name yourdomain.com api.yourdomain.com;
  return 301 https://$server_name$request_uri;
}
```

---

## Development Workflow

### Local Development

```bash
# Start all services
podman-compose up -d

# Follow logs in real-time
podman-compose logs -f

# Make code changes (auto-reload enabled)
# - Backend: watches packages/cms/src
# - Frontend: watches packages/frontend/src
```

### Running Tests

```bash
# Backend unit tests
podman exec ministrosfc-backend npm run test

# Backend E2E tests
podman exec ministrosfc-backend npm run test:e2e

# Frontend E2E tests (Playwright)
podman exec ministrosfc-frontend npm run test:e2e

# Frontend unit tests (Vitest)
podman exec ministrosfc-frontend npm run test:unit
```

### Debugging

**Backend Debug Mode**:

```bash
podman-compose stop backend

# Start in debug mode (add to docker-compose temporarily)
podman run -it --network ministrosfc_ministrosfc-network \
  --name ministrosfc-backend-debug \
  ministrosfc-backend npm run start:debug
```

**Frontend Debug**:

```bash
# Add debugger statements in code, then
podman logs -f ministrosfc-frontend
# Watch for debug output
```

### Database Inspection

```bash
# List all tables
podman exec ministrosfc-postgres psql -U ministros_user -d ministrosfc -c "\dt"

# View Prisma schema
podman exec ministrosfc-backend cat packages/cms/prisma/schema.prisma

# Generate Prisma client (after schema changes)
podman exec ministrosfc-backend npx prisma generate
```

---

## Performance Tuning

### Optimize PostgreSQL

```bash
# Increase shared_buffers for large datasets
podman exec ministrosfc-postgres psql -U ministros_user -d ministrosfc \
  -c "ALTER SYSTEM SET shared_buffers='256MB';"

# Restart PostgreSQL
podman-compose restart db
```

### Optimize PODMAN Resource Limits

Edit `docker-compose.yml` to add resource limits:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: "1"
          memory: 512M
        reservations:
          cpus: "0.5"
          memory: 256M
```

### Monitor Performance

```bash
# Real-time resource stats
podman stats

# Detailed container info
podman inspect ministrosfc-backend | grep -E "Memory|CpuShares"
```

---

## Additional Resources

- [PODMAN Documentation](https://docs.podman.io/)
- [PODMAN Compose](https://github.com/containers/podman-compose)
- [Nest.js Docs](https://docs.nestjs.com/)
- [Nuxt 4 Docs](https://nuxt.com/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Prisma Docs](https://www.prisma.io/docs/)

---

## Support & Issues

For issues with setup:

1. Check logs: `podman-compose logs -f`
2. Verify all services running: `podman-compose ps`
3. Test connectivity: `podman exec <service> ping <other-service>`
4. Review this guide's troubleshooting section
5. Consult official documentation or project issues
