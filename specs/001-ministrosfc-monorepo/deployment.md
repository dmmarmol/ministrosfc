# Deployment Guide: Fly.io Configuration

**Platform**: Fly.io  
**Decision Date**: March 17, 2026  
**Status**: Selected, not yet implemented  
**Cost**: $0/month (free tier)

---

## Fly.io Free Tier Allocation

### Available Resources

- **3 shared-CPU VMs** (256MB RAM each)
- **3GB PostgreSQL storage** (via Fly Postgres)
- **160GB outbound bandwidth/month**
- **Always-on** (no sleep/cold starts)

### VM Allocation Strategy

```
VM 1: Backend API (@ministrosfc/cms)
  - 256MB RAM
  - Node.js 23 LTS
  - Nest.js + Express
  - Port: 5102 (internal), 443 (external)
  - Auto-scaling: 1 instance (free tier)

VM 2: Frontend SSR (@ministrosfc/frontend)
  - 256MB RAM
  - Node.js 23 LTS
  - Nuxt 4 SSR
  - Port: 5103 (internal), 443 (external)
  - Auto-scaling: 1 instance (free tier)

VM 3: PostgreSQL Database
  - 256MB RAM
  - PostgreSQL 15
  - 3GB storage
  - Automatic backups (daily snapshots)
  - Private network only (not exposed publicly)
```

### Redis (Optional)

- **Not included in free tier** (would require 4th VM = paid)
- **Alternative**: Use Upstash Redis free tier (10k requests/day) if caching needed
- **MVP Decision**: Skip Redis initially, add later if performance requires it

---

## Deployment Architecture

```
Internet → Fly.io Edge (Global Anycast)
           ↓
      ┌─────────────────────────┐
      │   Fly.io Platform       │
      │                         │
      │  ┌─────────────────┐   │
      │  │ Frontend VM     │   │  ← ministrosfc.fly.dev (public)
      │  │ Nuxt 4 SSR      │   │
      │  │ 256MB RAM       │   │
      │  └────────┬────────┘   │
      │           │ API calls   │
      │           ↓             │
      │  ┌─────────────────┐   │
      │  │ Backend VM      │   │  ← api.ministrosfc.fly.dev (public API)
      │  │ Nest.js API     │   │
      │  │ 256MB RAM       │   │
      │  └────────┬────────┘   │
      │           │ SQL queries │
      │           ↓             │
      │  ┌─────────────────┐   │
      │  │ PostgreSQL VM   │   │  ← Internal only (private network)
      │  │ 3GB storage     │   │
      │  │ 256MB RAM       │   │
      │  └─────────────────┘   │
      └─────────────────────────┘
```

---

## File Structure for Fly.io Deployment

### Root fly.toml (Multi-app monorepo)

```toml
# Not used - each package has its own fly.toml
# Deploy from packages/cms/ and packages/frontend/ separately
```

### packages/cms/fly.toml

```toml
app = "ministrosfc-api"
primary_region = "mad"  # Madrid (closest to Spain)

[build]
  dockerfile = "Dockerfile"

[env]
  NODE_ENV = "production"
  PORT = "5102"

[[services]]
  protocol = "tcp"
  internal_port = 5102

  [[services.ports]]
    port = 80
    handlers = ["http"]

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]

  [services.concurrency]
    type = "connections"
    hard_limit = 25
    soft_limit = 20

  [[services.tcp_checks]]
    interval = "15s"
    timeout = "2s"
    grace_period = "5s"

[mounts]
  source = "data"
  destination = "/data"
```

### packages/frontend/fly.toml

```toml
app = "ministrosfc-frontend"
primary_region = "mad"  # Madrid

[build]
  dockerfile = "Dockerfile"

[env]
  NODE_ENV = "production"
  NUXT_PORT = "5103"
  API_BASE_URL = "https://ministrosfc-api.fly.dev"

[[services]]
  protocol = "tcp"
  internal_port = 5103

  [[services.ports]]
    port = 80
    handlers = ["http"]

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]

  [services.concurrency]
    type = "connections"
    hard_limit = 25
    soft_limit = 20

  [[services.http_checks]]
    interval = "10s"
    timeout = "2s"
    grace_period = "5s"
    path = "/api/health"
```

---

## Deployment Commands

### Initial Setup (One-time)

```bash
# 1. Install Fly CLI
curl -L https://fly.io/install.sh | sh

# 2. Authenticate
fly auth login

# 3. Create PostgreSQL database (uses 1 free VM)
fly postgres create --name ministrosfc-db --region mad --initial-cluster-size 1 --vm-size shared-cpu-1x --volume-size 3

# 4. Create backend app
cd packages/cms
fly launch --name ministrosfc-api --region mad --no-deploy

# 5. Attach database to backend
fly postgres attach --app ministrosfc-api ministrosfc-db

# 6. Set backend secrets
fly secrets set JWT_SECRET=$(openssl rand -base64 32) --app ministrosfc-api
fly secrets set JWT_EXPIRY="24h" --app ministrosfc-api
fly secrets set REFRESH_TOKEN_EXPIRY="30d" --app ministrosfc-api

# 7. Create frontend app
cd ../frontend
fly launch --name ministrosfc-frontend --region mad --no-deploy

# 8. Set frontend environment variables
fly secrets set API_BASE_URL="https://ministrosfc-api.fly.dev" --app ministrosfc-frontend
```

### Regular Deployment

```bash
# Deploy backend
cd packages/cms
fly deploy

# Deploy frontend
cd packages/frontend
fly deploy

# Deploy both (from root)
fly deploy --app ministrosfc-api --config packages/cms/fly.toml
fly deploy --app ministrosfc-frontend --config packages/frontend/fly.toml
```

### Database Migrations

```bash
# Run migrations against Fly.io database
cd packages/cms
fly proxy 5432 -a ministrosfc-db  # In separate terminal, proxies DB to localhost:5432
npx prisma migrate deploy  # In main terminal
```

---

## Environment Variables

### Backend (ministrosfc-api)

```bash
# Set via fly secrets set KEY=VALUE --app ministrosfc-api

DATABASE_URL          # Auto-set by fly postgres attach
JWT_SECRET            # Random 32-byte base64 string
JWT_EXPIRY            # "24h"
REFRESH_TOKEN_EXPIRY  # "30d"
NODE_ENV              # "production"
PORT                  # "5102"
```

### Frontend (ministrosfc-frontend)

```bash
# Set via fly secrets set KEY=VALUE --app ministrosfc-frontend

API_BASE_URL          # "https://ministrosfc-api.fly.dev"
NUXT_PORT             # "5103"
NODE_ENV              # "production"
PUBLIC_BRAND_COLOR    # "#D4AF37" (gold)
```

---

## Monitoring & Logs

```bash
# View logs
fly logs --app ministrosfc-api
fly logs --app ministrosfc-frontend

# Monitor resources
fly status --app ministrosfc-api
fly status --app ministrosfc-frontend

# Database status
fly status --app ministrosfc-db

# SSH into VMs
fly ssh console --app ministrosfc-api
fly ssh console --app ministrosfc-frontend
```

---

## CI/CD with GitHub Actions

Create `.github/workflows/deploy-flyio.yml`:

```yaml
name: Deploy to Fly.io

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - run: flyctl deploy --config packages/cms/fly.toml
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - run: flyctl deploy --config packages/frontend/fly.toml
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

**Setup**: Add `FLY_API_TOKEN` to GitHub repo secrets (get from `fly auth token`)

---

## Cost Breakdown

| Resource                   | Free Tier | Usage           | Cost         |
| -------------------------- | --------- | --------------- | ------------ |
| Backend VM (256MB)         | 3 VMs     | 1 VM            | $0           |
| Frontend VM (256MB)        | 3 VMs     | 1 VM            | $0           |
| PostgreSQL VM (256MB, 3GB) | 3 VMs     | 1 VM            | $0           |
| Bandwidth (160GB/month)    | 160GB     | ~10GB estimated | $0           |
| **Total**                  |           |                 | **$0/month** |

### Upgrade Path (if needed)

- Additional RAM: ~$2/month per 256MB increment
- Additional VM: ~$2-4/month per shared-CPU VM
- More storage: ~$0.15/GB/month
- Redis VM: ~$2/month for 256MB instance

---

## Migration from Podman Compose (Local → Fly.io)

### Local Development (docker-compose.yml with podman-compose)

```yaml
services:
  postgres:
    image: postgres:15
    ports: ["5100:5432"] # Host port 5100 → Container port 5432
    environment:
      POSTGRES_DB: ministrosfc_dev
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: dev123

  redis:
    image: redis:7-alpine
    ports: ["5101:6379"] # Host port 5101 → Container port 6379
```

**Note**: Local development uses ports 5100-5103 on host, while containers use standard ports internally.

### Fly.io Production

- PostgreSQL: Managed by Fly Postgres (DATABASE_URL secret points to managed instance)
- Redis: Skip for free tier, or use Upstash free tier
- Backend/Frontend: Dockerfiles use standard container ports (3001, 3000), exposed via Fly.io's 443

---

## Troubleshooting

### VM Running Out of Memory

```bash
# Check memory usage
fly ssh console --app ministrosfc-api
free -m

# Solution: Upgrade to 512MB RAM (~$2/month)
fly scale memory 512 --app ministrosfc-api
```

### Database Full (3GB limit)

```bash
# Check database size
fly postgres connect --app ministrosfc-db
SELECT pg_size_pretty(pg_database_size('ministrosfc'));

# Solution: Clear old data or upgrade storage
fly volumes extend <volume-id> --size 5
```

### Cold Start Issues

- Fly.io free tier has **no cold starts** (always-on)
- If VM restarts, startup time ~10-15 seconds

---

## Next Steps

1. **Implement Dockerfiles** (T011, T013 in tasks.md)
2. **Create fly.toml files** (this guide)
3. **Set up GitHub Actions** (optional, can deploy manually)
4. **Run initial deployment** after Phase 5 testing complete

---

**Status**: ✅ Documented, ready for implementation in Phase 5  
**Last Updated**: March 17, 2026
