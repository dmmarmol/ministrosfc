# API Contract: Team Statistics

**Feature**: 017-team-stats-views  
**Base URL**: `/api/v1/statistics`  
**Auth**: See per-endpoint notes

---

## Existing endpoints (unchanged)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/statistics/players` | Public | Top scorers list |
| GET | `/api/v1/statistics/players/:id` | Public | Single player career stats |
| GET | `/api/v1/statistics/top-scorers` | Public | Top scorers with limit |
| GET | `/api/v1/statistics/tournaments/:id` | Public | Tournament stats |

---

## New endpoints

### GET /api/v1/statistics/team/summary

Returns the all-time team summary header (records, totals).

**Auth**: `authenticate` (any authenticated user)  
**Query params**: none  
**Response 200**:
```json
{
  "data": {
    "totalGames": 997,
    "totalWins": 320,
    "totalLosses": 490,
    "totalDraws": 187,
    "totalGoalsFor": 1240,
    "totalGoalsAgainst": 1580,
    "winRate": 32.1,
    "rivalMostPlayed": { "name": "La Cocina", "count": 45 },
    "rivalMostWins": { "name": "Estrella Roja", "count": 12 },
    "rivalMostLosses": { "name": "La Cocina", "count": 28 },
    "rivalMostDraws": { "name": "Trabajo y Prev", "count": 8 },
    "bestWin": { "rival": "La Cocina", "tournament": "Liga", "date": "2024-03-10", "score": "5-0" },
    "worstLoss": { "rival": "Leones", "tournament": "Liga", "date": "2023-09-23", "score": "0-6" },
    "rivalMostGoalsFor": { "name": "La Cocina", "totalGoals": 89 },
    "rivalMostGoalsAgainst": { "name": "La Cocina", "totalGoals": 140 },
    "topScorer": { "name": "Patricio Herrera", "goals": 78 }
  }
}
```

---

### GET /api/v1/statistics/team/by-year

Returns team stats grouped by calendar year.

**Auth**: `authenticate`  
**Query params**:
- `tournamentId` (optional, UUID) — filter to a specific tournament

**Response 200**:
```json
{
  "data": [
    {
      "label": "2024",
      "gamesPlayed": 120,
      "wins": 40,
      "losses": 60,
      "draws": 20,
      "goalsFor": 160,
      "goalsAgainst": 200,
      "goalDifference": -40,
      "winRate": 33.3,
      "pointsEarned": 140
    }
  ]
}
```

---

### GET /api/v1/statistics/team/by-tournament

Returns team stats grouped by tournament (and optionally year).

**Auth**: `authenticate`  
**Query params**:
- `year` (optional, integer) — filter to a specific year
- `rivalId` (optional, UUID) — filter to a specific rival

**Response 200**:
```json
{
  "data": [
    {
      "label": "Liga 2024",
      "tournamentId": "uuid",
      "year": 2024,
      "gamesPlayed": 80,
      "wins": 25,
      "losses": 40,
      "draws": 15,
      "goalsFor": 100,
      "goalsAgainst": 130,
      "goalDifference": -30,
      "winRate": 31.3,
      "pointsEarned": 90
    }
  ]
}
```

---

### GET /api/v1/statistics/team/by-rival

Returns team stats grouped by opponent.

**Auth**: `authenticate`  
**Query params**:
- `year` (optional, integer) — filter to a specific year
- `tournamentId` (optional, UUID)

**Response 200**:
```json
{
  "data": [
    {
      "label": "La Cocina",
      "rivalId": "uuid",
      "gamesPlayed": 45,
      "wins": 10,
      "losses": 28,
      "draws": 7,
      "goalsFor": 45,
      "goalsAgainst": 90,
      "goalDifference": -45,
      "winRate": 22.2,
      "pointsEarned": 37
    }
  ]
}
```

---

### GET /api/v1/statistics/team/rivals/:rivalId

Returns team stats for a single rival, broken down by year and tournament.

**Auth**: `authenticate`  
**Path params**: `rivalId` (UUID)  
**Query params**: `year` (optional, integer)

**Response 200**:
```json
{
  "data": {
    "rival": { "id": "uuid", "name": "La Cocina" },
    "summary": { "gamesPlayed": 45, "wins": 10, "losses": 28, "draws": 7 },
    "byYear": [ { "label": "2024", "gamesPlayed": 8, ... } ],
    "byTournament": [ { "label": "Liga 2024", "gamesPlayed": 6, ... } ]
  }
}
```

---

### GET /api/v1/statistics/players (extended)

Extended to also support player-level stats with win/draw/loss breakdown.

**Auth**: Public  
**Query params**:
- `year` (optional, integer) — added param
- `tournamentId` (optional, UUID) — existing param
- `rivalId` (optional, UUID) — added param

**Response 200** (extended `PlayerStatRowDTO`):
```json
{
  "data": [
    {
      "playerId": "uuid",
      "playerName": "Patricio Herrera",
      "playerNickname": "Pato",
      "gamesPlayed": 450,
      "wins": 145,
      "losses": 220,
      "draws": 85,
      "goals": 78,
      "assists": 34,
      "yellowCards": 12,
      "redCards": 1,
      "winRate": 32.2,
      "goalRate": 0.17
    }
  ]
}
```

---

## New endpoint: CSV Import

### POST /api/v1/import/csv

Batch import of historical data from three Google Spreadsheet CSV exports.

**Auth**: `authenticate` + `requireRole("ADMIN")`  
**Content-Type**: `multipart/form-data`  
**Form fields**:
- `historial` (file, required) — `historial.csv` 
- `jugadores` (file, required) — `jugadores.csv`
- `apariciones` (file, required) — `apariciones.csv`

**Response 200**:
```json
{
  "data": {
    "players": { "created": 61, "updated": 0, "skipped": 0 },
    "games": { "created": 997, "updated": 0, "skipped": 0 },
    "appearances": { "created": 887, "updated": 0, "skipped": 0 },
    "warnings": [
      "Aparicion row 42: player 'Unknown Name' not found in jugadores; created minimal player record"
    ]
  }
}
```

**Response 422** (validation failure):
```json
{
  "error": "CSV_PARSE_ERROR",
  "message": "historial.csv row 5: invalid date format '2023-9-9' — expected DD/MM/YYYY"
}
```

**Import order**: jugadores → historial (creates games) → apariciones (creates participants).  
**Idempotency**: Re-upload produces same counts but `created: 0, updated: N` or `skipped: N`.
