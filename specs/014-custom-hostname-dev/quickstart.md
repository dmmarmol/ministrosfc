# Quickstart: Custom Hostname Dev Access

**Feature**: `014-custom-hostname-dev`

This guide documents how to enable `localhost.ministrosfc.com` access for the dev servers.

---

## Prerequisites

### 1. `/etc/hosts` entry (one-time, machine-level)

Verify the entry exists:

```bash
grep "localhost.ministrosfc.com" /etc/hosts
```

Expected output:

```
127.0.0.1 localhost.ministrosfc.com
```

If missing, add it:

```bash
echo "127.0.0.1 localhost.ministrosfc.com" | sudo tee -a /etc/hosts
```

---

## Setup

### 2. Create `packages/cms/.env.local`

This file is gitignored. Create it (or add to it if it exists):

```bash
cat >> packages/cms/.env.local << 'EOF'
# Custom hostname CORS support
CORS_ORIGINS=http://localhost:5103,http://localhost.ministrosfc.com:5103
EOF
```

> **Note**: The base `.env` or `.env.example` uses `CORS_ORIGINS` with a single value.
> The `.env.local` override adds the custom hostname as a second origin.

### 3. Create `packages/frontend/.env.local`

```bash
cat >> packages/frontend/.env.local << 'EOF'
# Bind dev server to all interfaces (enables custom hostname access)
NUXT_HOST=0.0.0.0
EOF
```

---

## Start Dev Servers

No changes to the startup command:

```bash
npm run dev:all
```

Both servers start with custom hostname support active.

---

## Verify

### Frontend (Story 1)

Open in browser: `http://localhost.ministrosfc.com:5103`

Expected: The application loads normally. No connection refused.

### API/CORS (Story 2)

1. Open `http://localhost.ministrosfc.com:5103` in the browser.
2. Open browser DevTools → **Network** tab.
3. Perform any action that makes an API call (log in, load player list).
4. Verify:
   - Requests to `http://localhost:5102/api/v1/...` complete with **200** (or appropriate status).
   - No `CORS` or `preflight` errors in the **Console** tab.

### Backend direct access (Story 3)

```bash
curl http://localhost.ministrosfc.com:5102/api/v1/health
```

Expected: `{"status":"ok"}` (or equivalent health response).

### Regression check — localhost still works

- `http://localhost:5103` still loads the frontend.
- `curl http://localhost:5102/api/v1/health` still returns a health response.

---

## Reset / Disable

To disable the custom hostname binding, remove the env vars from `.env.local`:

```bash
# Remove NUXT_HOST from frontend .env.local
sed -i '' '/NUXT_HOST/d' packages/frontend/.env.local

# Remove custom origin from CMS CORS_ORIGINS
# (edit packages/cms/.env.local manually or remove the file)
```

After editing `.env.local`, restart with `npm run dev:all`.

---

## Troubleshooting

| Problem | Likely cause | Fix |
|---------|-------------|-----|
| Browser shows "Connection refused" at `localhost.ministrosfc.com:5103` | `NUXT_HOST` not set or frontend not restarted | Verify `.env.local`, restart `dev:all` |
| CORS error in browser console | `CORS_ORIGINS` missing the custom origin or CMS not restarted | Check `packages/cms/.env.local`, restart `dev:all` |
| DNS resolution fails for `localhost.ministrosfc.com` | `/etc/hosts` entry missing | Re-add the hosts entry (see Prerequisites) |
| `localhost:5103` stopped working | `NUXT_HOST` incorrectly set | Ensure `NUXT_HOST=0.0.0.0` (not a hostname that overrides localhost routing) |
