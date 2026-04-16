# Quickstart: Team Statistics Views

**Branch**: `chore/017-team-stats-views` | **Date**: 2026-04-16

---

## Prerequisites

- Docker + PostgreSQL running (`npm run dev:all` or `docker-compose up`)
- CMS running on `http://localhost:3001`
- Frontend running on `http://localhost:3000`
- Admin credentials: `admin@ministrosfc.com` / `Admin1234!`

---

## Step 1: Apply Database Migrations

```bash
cd packages/cms
npx prisma migrate dev --name add-game-import-fields
```

This adds `startTime`, `endTime`, `coach`, `photoUrl` to `Game` and `isStarter` to `GameParticipant`.

---

## Step 2: Import Historical CSV Data

```bash
# From repo root — import all three CSV files in one request
curl -X POST http://localhost:3001/api/v1/import/csv \
  -H "Authorization: Bearer <admin-token>" \
  -F "historial=@data/historial.csv" \
  -F "jugadores=@data/jugadores.csv" \
  -F "apariciones=@data/apariciones.csv"
```

Expected response:
```json
{
  "data": {
    "players": { "created": 61, "updated": 0, "skipped": 0 },
    "games": { "created": 997, "updated": 0, "skipped": 0 },
    "appearances": { "created": 887, "updated": 0, "skipped": 0 },
    "warnings": []
  }
}
```

---

## Step 3: Verify Team Stats API

```bash
# Get auth token
TOKEN=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ministrosfc.com","password":"Admin1234!"}' \
  | jq -r '.accessToken')

# All-time summary
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/v1/statistics/team/summary

# Stats by year
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/v1/statistics/team/by-year
```

---

## Step 4: View Frontend Stats Dashboard

1. Navigate to `http://localhost:3000/stats`
2. Log in with any authenticated user
3. The stats dashboard should show:
   - All-time summary header with 10 records
   - "All Years" table by default
4. Use the focus mode selector to switch between All Years / All Tournaments / All Rivals / All Players
5. Apply year/tournament/rival filters — observe URL query params updating

---

## Step 5: View Public Player Stats

1. Navigate to `http://localhost:3000/players/<player-id>` (or click any player from the roster)
2. Scroll to the stats section — no login required
3. Career stats (games played, won, lost, drawn, goals, win rate) are visible
4. Filter by year using the year selector — URL updates

---

## Running Tests

```bash
# CMS integration tests (includes import tests)
cd packages/cms
npm test -- --testPathPattern=import

# Frontend unit tests
cd packages/frontend
npm run test

# Frontend E2E (Playwright)
cd packages/frontend
npx playwright test --grep "stats"
```

---

## Re-import (Idempotency Check)

```bash
# Run the same import a second time — should return all skipped/updated, no duplicates
curl -X POST http://localhost:3001/api/v1/import/csv \
  -H "Authorization: Bearer <admin-token>" \
  -F "historial=@data/historial.csv" \
  -F "jugadores=@data/jugadores.csv" \
  -F "apariciones=@data/apariciones.csv"
# Expected: no new records created
```
