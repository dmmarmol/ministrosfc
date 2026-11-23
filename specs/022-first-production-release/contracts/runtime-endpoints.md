# Contract: Runtime endpoints and behaviors

## CMS

### `GET /api/v1/health` (liveness)

Dependency-free; never touches the database or Redis; used by Fly health checks and uptime probes.

- `200 { "status": "ok", "uptime": <seconds> }`

This changes the previous response, which included `database` and `redis`. Those fields move to the readiness endpoint.

### `GET /api/v1/health/ready` (readiness)

Checks the database (`SELECT 1`) and Redis (`PING`). The result is cached in memory for 30 seconds so repeated calls cannot keep waking the database. Subject to the existing API rate limiter.

- `200 { "status": "ok", "database": "connected", "redis": "connected" | "disabled" }`
- `503 { "status": "degraded", "database": "connected" | "disconnected", "redis": "connected" | "disconnected" | "disabled" }`

`redis: "disabled"` is reported when `REDIS_DISABLED=true` outside production.

### `GET /api/v1/config`

Public, dependency-free capability flags for the frontend.

- `200 { "photoUploadsEnabled": boolean }`

`photoUploadsEnabled` is true only when all three photo storage credentials are present.

### Photo upload when not configured

Any player or profile photo upload that reaches the CMS while photo storage is not configured returns `503` with the standard error shape, code `PHOTO_STORAGE_UNAVAILABLE` and a Spanish message. Requests without a photo are unaffected.

### Game status synchronization

- Runs once at process start.
- Runs again, at most once every 5 minutes per process, when a request reads games (list or detail). No timer runs while the process is idle.
- Failures are logged and never fail the request.

### Startup validation (`validateEnv`)

- Always required: `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGINS`.
- `APP_ENV` (`development` or `production`) is required when `NODE_ENV=production` (every deployed app); otherwise it defaults to `development` so local setups keep working. Any other value is rejected.
- Redis: `REDIS_URL` or `REDIS_HOST`+`REDIS_PORT`, or `REDIS_DISABLED=true` when `APP_ENV` is not `production`. `REDIS_URL` is required when `APP_ENV=production`.
- Photo storage: none required. If any of `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` is set, all three must be set.
- Production origins: when `APP_ENV=production`, `CORS_ORIGINS` must not contain `localhost` or a non-HTTPS origin.
- Failure message lists every problem and points to `packages/cms/.env.example`.

## Frontend

### `GET /robots.txt`

- `APP_ENV=production`: allows public routes, disallows `/admin`, `/profile`, `/login`, `/register`, `/auth`, `/games/*/signup`, and lists no sitemap unless one exists.
- Otherwise: `User-agent: *` and `Disallow: /`.

### Response headers

- Non-production: every response includes `X-Robots-Tag: noindex, nofollow`.
- Public routes (`/`, `/roster`, `/schedule`, `/tournaments/**`, `/statistics/**`, `/players/**`, `/games/**` except signup): served with stale-while-revalidate for 5 minutes. `/admin/**`, `/profile/**`, `/login`, `/register`, `/auth/**` are never cached.

### Crawler and rate controls (Nitro middleware)

- Requests whose user agent is on a small deny-list of abusive crawlers receive `403` without any API or database call.
- A per-IP in-memory limiter on SSR routes returns `429` above a generous threshold (default 120 requests per minute); static assets and health probes are exempt.

### Photo input

The admin player form shows the photo input only when `GET /api/v1/config` reports `photoUploadsEnabled: true`; otherwise the input is hidden and the form works without it.
