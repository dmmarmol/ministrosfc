# Data Model: Team Statistics Views

**Branch**: `chore/017-team-stats-views` | **Date**: 2026-04-16

---

## Schema Changes (Prisma Migrations)

### Migration 1: Game — add import fields

```prisma
model Game {
  // ... existing fields ...
  startTime  String?  @db.VarChar(5)    // HH:MM — e.g. "10:00"
  endTime    String?  @db.VarChar(5)    // HH:MM — e.g. "11:30"
  coach      String?  @db.VarChar(255)  // DT at match time
  photoUrl   String?                    // match photo URL

  // Updated unique index for idempotent import upsert:
  @@unique([date, opponentTeamId, tournamentId])
}
```

### Migration 2: GameParticipant — add starter flag

```prisma
model GameParticipant {
  // ... existing fields ...
  isStarter  Boolean?  // true=Titular, false=Suplente, null=unknown
}
```

---

## Entity Relationships (existing + new)

```
Tournament (1) ──── (N) Game (N) ──── (N) GameParticipant (N) ──── (1) Player
                         │
                         └── (N) OpponentTeam (1)
```

No new Prisma models are introduced. All stats are derived from queries over existing entities.

---

## CSV → Entity Mapping

### `historial.csv` → Game + Tournament + OpponentTeam

| CSV Column         | Target                         | Transformation                        |
| ------------------ | ------------------------------ | ------------------------------------- |
| Fecha              | `Game.date`                    | Parse `DD/MM/YYYY` → `DateTime`       |
| Torneo             | `Tournament.name`              | Upsert by name                        |
| Comienzo           | `Game.startTime`               | String as-is (`"10:00"`)              |
| Finalización       | `Game.endTime`                 | String as-is (`"11:30"`)              |
| Equipo             | (ignored)                      | Always "Ministros"                    |
| Rival              | `OpponentTeam.name`            | Upsert by name (trimmed)              |
| Estadio            | `Game.location`                | String                                |
| Goles Convertidos  | `Game.homeTeamScore`           | Integer                               |
| Goles Recibidos    | `Game.awayTeamScore`           | Integer                               |
| Resultado          | (ignored)                      | Derived from scores                   |
| Conclusión         | (validation only)              | G/P/E cross-checked vs scores         |
| Apariciones        | (ignored)                      | TRUE/FALSE flag — not a count         |
| DT                 | `Game.coach`                   | Optional string                       |
| Comentarios        | `Game.notes`                   | Optional string                       |
| Foto               | `Game.photoUrl`                | Optional URL string                   |
| (last date col)    | (ignored)                      | Duplicate date artefact               |

Game `status` is set to `COMPLETED` for all imported rows. Game `competitionType` is set to `LEAGUE` by default (all historical rows are Liga).

### `jugadores.csv` → Player

| CSV Column      | Target                  | Transformation                                     |
| --------------- | ----------------------- | -------------------------------------------------- |
| Jugador (N)     | `Player.name`           | Upsert key; strip count annotation from header     |
| Apodo           | `Player.nickname`       | Optional                                           |
| Invitado Por    | `Player.invitedById`    | Lookup Player by name, resolve to UUID             |
| Nacimiento      | `Player.dateOfBirth`    | Parse `DD/MM/YYYY` → `YYYY-MM-DD` string, optional |
| Edad            | (ignored)               | Derived field                                      |
| Altura          | `Player.height`         | Integer cm, optional                               |
| Numero          | `Player.jerseyNumber`   | Integer, optional                                  |
| Pie             | `Player.dominantFoot`   | Map: "Diestro"→RIGHT, "Zurdo"→LEFT, else AMBIDEXTROUS |
| Posición        | `Player.position`       | Map to Position enum; null if unrecognised         |
| DNI             | `Player.nationalId`     | Optional string                                    |
| Telefono        | `Contact.phone`         | Optional (via contactInfo relation)                |
| Imagen (URL)    | `Player.photoUrl`       | Optional URL                                       |

`playerType` defaults to `REGISTERED`. `status` defaults to `ACTIVE`.

### `apariciones.csv` → GameParticipant

| CSV Column      | Target                          | Transformation                                          |
| --------------- | ------------------------------- | ------------------------------------------------------- |
| Fecha           | (game lookup key)               | Parse `YYYY/MM/DD` → `DateTime`                         |
| Rival           | (game lookup key)               | Match `OpponentTeam.name`                               |
| Torneo          | (game lookup key)               | Match `Tournament.name`                                 |
| Resultado       | (game lookup key, secondary)    | Cross-check; not stored                                 |
| col 5 (G/P/E)   | (ignored)                       | Derived from game scores                                |
| Jugador         | `GameParticipant.playerId`      | Lookup `Player.name`; create minimal player if missing  |
| Jugador (apodo) | (ignored in import)             | Informational only                                      |
| Goles           | `GameParticipant.goalsScored`   | Integer                                                 |
| Amarilla        | `GameParticipant.yellowCards`   | Integer                                                 |
| Roja            | `GameParticipant.redCards`      | Integer                                                 |
| Asistencia      | `GameParticipant.assists`       | Integer (this is assists, not appearances)              |
| Titular/Suplente| `GameParticipant.isStarter`     | "Titular"→true, "Suplente"→false, blank→null            |
| Comentarios     | `GameParticipant.notes`         | Optional string                                         |

Game lookup: find `Game` where `(date == fecha AND opponentTeam.name == rival AND tournament.name == torneo)`.
If no match found → skip with warning (do not create orphan appearances).

---

## Derived Statistics (no new tables)

### Team stat aggregation queries (computed at API time)

```typescript
// Team stats by year
SELECT
  YEAR(date) as year,
  COUNT(*) as gamesPlayed,
  SUM(CASE WHEN homeTeamScore > awayTeamScore THEN 1 ELSE 0 END) as wins,
  SUM(CASE WHEN homeTeamScore < awayTeamScore THEN 1 ELSE 0 END) as losses,
  SUM(CASE WHEN homeTeamScore = awayTeamScore THEN 1 ELSE 0 END) as draws,
  SUM(homeTeamScore) as goalsFor,
  SUM(awayTeamScore) as goalsAgainst
FROM Game
WHERE status = 'COMPLETED' AND tournamentId = ? (optional)
GROUP BY YEAR(date)
ORDER BY year DESC
```

(Equivalent Prisma raw query or `groupBy` with `_count`, `_sum`)

### All-time summary header records (single SQL pass)
- Rival with most games: `GROUP BY opponentTeamId ORDER BY count DESC LIMIT 1`
- Best win: `ORDER BY (homeTeamScore - awayTeamScore) DESC LIMIT 1` where homeTeamScore > awayTeamScore
- Top scorer: `GROUP BY playerId ORDER BY SUM(goalsScored) DESC LIMIT 1` on GameParticipant

---

## Shared Type DTOs (packages/shared/src/types/statistics.ts additions)

```typescript
// Team stats for a single period (year, tournament, or rival)
export interface TeamStatPeriodDTO {
  label: string;          // e.g. "2023", "Liga", "La Cocina"
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  winRate: number;        // 0–100, rounded to 1 decimal
  pointsEarned: number;   // 3*wins + 1*draws
}

// All-time team summary header  
export interface TeamSummaryHeaderDTO {
  totalGames: number;
  totalWins: number;
  totalLosses: number;
  totalDraws: number;
  totalGoalsFor: number;
  totalGoalsAgainst: number;
  winRate: number;
  rivalMostPlayed: { name: string; count: number };
  rivalMostWins: { name: string; count: number };
  rivalMostLosses: { name: string; count: number };
  rivalMostDraws: { name: string; count: number };
  bestWin: { rival: string; tournament: string; date: string; score: string };
  worstLoss: { rival: string; tournament: string; date: string; score: string };
  rivalMostGoalsFor: { name: string; totalGoals: number };
  rivalMostGoalsAgainst: { name: string; totalGoals: number };
  topScorer: { name: string; goals: number };
}

// Per-player stats row for "All Players" focus mode
export interface PlayerStatRowDTO {
  playerId: string;
  playerName: string;
  playerNickname?: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  winRate: number;
  goalRate: number;
}

// CSV import result summary
export interface CsvImportResultDTO {
  players: { created: number; updated: number; skipped: number };
  games: { created: number; updated: number; skipped: number };
  appearances: { created: number; updated: number; skipped: number };
  warnings: string[];
}
```
