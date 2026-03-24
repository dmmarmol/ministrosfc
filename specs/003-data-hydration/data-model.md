# Data Model: Data Hydration from Google Sheets

**Feature**: 003-data-hydration | **Phase**: 1 | **Date**: March 23, 2026

---

## Overview

All entities are defined in the existing Prisma schema (`packages/cms/prisma/schema.prisma`). This document maps each source CSV column to its target Prisma field and describes all transformation rules applied during import.

**No schema changes required for this feature.** All entities needed (`OpponentTeam`, `Tournament`, `Player`, `Contact`, `Game`, `GameParticipant`) already exist in the schema.

---

## Entity 1: `OpponentTeam`

**Source**: `Historial.csv` — unique values of the `Rival` column

**Extraction logic**: Collect all distinct, trimmed `Rival` values from Historial.csv

| Prisma field | Value                 | Notes                                    |
| ------------ | --------------------- | ---------------------------------------- |
| `id`         | `crypto.randomUUID()` | Pre-generated; reused in Game FK map     |
| `name`       | `Rival` (trimmed)     | Unique constraint; used as FK lookup key |
| `logoUrl`    | `null`                | Not in spreadsheet                       |
| `colors`     | `null`                | Not in spreadsheet                       |
| `city`       | `null`                | Not in spreadsheet                       |
| `country`    | `null`                | Not in spreadsheet                       |

**Validation**: Skip if `Rival` is empty or whitespace-only (log warning).

**Records expected**: 26

---

## Entity 2: `Tournament`

**Source**: `Historial.csv` — derived by grouping games by `(Torneo + year(Fecha))`

**Derivation logic**:

1. Parse all `Fecha` values from Historial.csv (format: `DD/MM/YYYY`)
2. Group by `{ torneo: row.Torneo, year: getYear(parsedDate) }`
3. For each group: `name = "${year} ${torneo}"`, `startDate = min(parsedDates)`, `endDate = max(parsedDates)`

| Prisma field      | Derived from                           | Notes                                |
| ----------------- | -------------------------------------- | ------------------------------------ |
| `id`              | `crypto.randomUUID()`                  | Pre-generated; reused in Game FK map |
| `name`            | `"${year} ${torneo}"`                  | e.g., `"2024 Amistoso"`              |
| `competitionType` | Mapped from `torneo` (see table below) |                                      |
| `startDate`       | `min(Fecha)` in group                  | First game date of tournament        |
| `endDate`         | `max(Fecha)` in group                  | Last game date of tournament         |
| `description`     | `null`                                 | Not in spreadsheet                   |

**CompetitionType mapping**:
| Torneo (raw) | `competitionType` |
|---|---|
| `Liga` | `LEAGUE` |
| `Torneo Apertura` | `SEASON` |
| `Torneo Clausura` | `SEASON` |
| `Torneo Mundialito` | `CUP` |
| `Copa de Oro` | `CUP` |
| `Amistoso` | `FRIENDLY` |
| _(any other)_ | `LEAGUE` (fallback; log warning) |

**Records expected**: 9

---

## Entity 3: `Player`

**Source**: `Jugadores.csv` — one row per player

| CSV column     | Prisma field   | Transformation                                                                                           |
| -------------- | -------------- | -------------------------------------------------------------------------------------------------------- |
| `Jugador`      | `name`         | Trim whitespace                                                                                          |
| `Apodo`        | `nickname`     | Trim; store `null` if empty or value is `??`                                                             |
| `Nacimiento`   | `dateOfBirth`  | Store as string (year only, e.g., `"1991"`); null if empty                                               |
| `Altura`       | `height`       | `parseInt()`, null if empty or non-numeric                                                               |
| `Numero`       | `jerseyNumber` | `parseInt()`, null if empty or non-numeric                                                               |
| `Pie`          | `dominantFoot` | See enum mapping below; null if empty                                                                    |
| `Posición`     | `position`     | Split on `,`, take first valid enum value; null if none valid                                            |
| `DNI`          | `nationalId`   | Trim; null if empty                                                                                      |
| `Imagen (URL)` | `photoUrl`     | Always overridden with `https://placehold.co/200x200?text=Player`                                        |
| _(derived)_    | `playerType`   | `GUEST` if name or nickname contains `"Amigo de"` or `"Amigo del"` (case-insensitive); else `REGISTERED` |
| _(constant)_   | `status`       | Always `ACTIVE`                                                                                          |
| _(constant)_   | `invitedById`  | Always `null` (no user accounts in this import)                                                          |

**Foot enum mapping**:
| CSV value | `dominantFoot` |
|---|---|
| `Zurdo` | `LEFT` |
| `Diestro` | `RIGHT` |
| `Ambidiestro` | `AMBIDEXTROUS` |
| _(empty)_ | `null` |

**Position unmapped values**:
| CSV value | Mapped to | Reason |
|---|---|---|
| `SMF` | `CMF` | Side-mid treated as central mid; `SMF` not in schema |
| `LIB` | `CB` | Libero is a sweeper/center-back role |

**Multi-position handling**: Split `Posición` on `,`. Apply `SMF→CMF` / `LIB→CB` substitutions. Store only the first recognized enum value. Log discarded positions as informational warnings.

**Guest detection rule**:

```typescript
const isGuest = (name: string, nickname: string | null): boolean => {
  const patterns = ["amigo de", "amigo del"];
  return patterns.some(
    (p) =>
      name.toLowerCase().includes(p) ||
      (nickname ?? "").toLowerCase().includes(p),
  );
};
```

**Validation**: Skip row if `Jugador` (name) is empty. Log warning with row index.

**Records expected**: 61 rows → up to 61 Player records

---

## Entity 4: `Contact`

**Source**: `Jugadores.csv` — same rows as Player; conditional on `Telefono` being non-empty

| CSV column    | Prisma field       | Notes                                  |
| ------------- | ------------------ | -------------------------------------- |
| _(Player FK)_ | `playerId`         | Pre-generated UUID from the Player row |
| `Telefono`    | `phone`            | Stored as-is; no normalization         |
| _(absent)_    | `whatsapp`         | `null`                                 |
| _(absent)_    | `emergencyContact` | `null`                                 |

**Condition**: Only create Contact if `Telefono.trim()` is non-empty.

**Records expected**: ~30 Contact records (players who have a phone number)

---

## Entity 5: `Game`

**Source**: `Historial.csv` — one row per game

| CSV column          | Prisma field      | Transformation                                                               |
| ------------------- | ----------------- | ---------------------------------------------------------------------------- |
| `Fecha`             | `date`            | Parse `DD/MM/YYYY` → UTC DateTime (`YYYY-MM-DDT00:00:00.000Z`)               |
| `Rival`             | `opponentTeamId`  | Lookup from OpponentTeam map by trimmed name                                 |
| _(derived)_         | `tournamentId`    | Lookup from Tournament map by `"${year} ${torneo}"` key; `null` if not found |
| `Estadio`           | `location`        | Trim; null if empty                                                          |
| _(derived)_         | `competitionType` | Same mapping as Tournament's `competitionType`; uses Torneo column           |
| `Goles Convertidos` | `homeTeamScore`   | `parseInt()`; null if empty or non-numeric                                   |
| `Goles Recibidos`   | `awayTeamScore`   | `parseInt()`; null if empty or non-numeric                                   |
| `Conclusión`        | `status`          | `G`, `P`, `E` → `COMPLETED`; empty → `SCHEDULED`; `FALSE` → skip row         |
| _(assembled)_       | `notes`           | See assembly rule below                                                      |
| _(constant)_        | `possession`      | `null`                                                                       |
| _(constant)_        | `shotsOnTarget`   | `null`                                                                       |
| _(constant)_        | `fouls`           | `null`                                                                       |

**`game.notes` assembly**:

```typescript
const parts: string[] = [];
if (row.DT) parts.push(`DT: ${row.DT}`);
if (row.Comienzo && row.Finalización)
  parts.push(`Horario: ${row.Comienzo}–${row.Finalización}`);
if (row.Comentarios) parts.push(row.Comentarios);
const notes = parts.length > 0 ? parts.join("\n") : null;
```

**Row skipping**:

- Skip if `Rival` is empty
- Skip if `Fecha` is empty or unparseable
- Skip if `Conclusión` value is `FALSE` (these are empty placeholder rows at the end of the sheet)

**Game lookup key** (for Apariciones cross-reference):

```typescript
const gameKey = `${toISO(parsedDate)}:${rival.trim().toLowerCase()}`;
// e.g., "2023-09-09:la cocina"
```

**Records expected**: ~63 Game records

---

## Entity 6: `GameParticipant`

**Source**: `Apariciones.csv` — one row per player-game appearance

| CSV column        | Prisma field         | Transformation                                                         |
| ----------------- | -------------------- | ---------------------------------------------------------------------- |
| `Fecha` + `Rival` | `gameId`             | Lookup from Game map via `YYYY-MM-DD:rival-lowercase` key              |
| `Jugador (col 6)` | `playerId`           | Lookup by `name` (lower+trim); fallback: `Jugador (col 7)` by nickname |
| `Goles`           | `goalsScored`        | `parseInt()`, default `0`                                              |
| `Amarilla`        | `yellowCards`        | `parseInt()`, default `0`                                              |
| `Roja`            | `redCards`           | `parseInt()`, default `0`                                              |
| `Comentarios`     | `notes`              | Trim; null if empty                                                    |
| _(constant)_      | `confirmationStatus` | `CONFIRMED`                                                            |
| _(constant)_      | `assists`            | `0` (not in CSV)                                                       |
| _(constant)_      | `minutesPlayed`      | `null` (not in CSV)                                                    |
| _(constant)_      | `confirmedById`      | `null`                                                                 |

**Date parsing**: Apariciones uses `YYYY/MM/DD` → replace all `/` with `-` → ISO date string.

**Row skipping**:

- Skip if game lookup key not found in game map (log warning: "No game found for date+rival")
- Skip if player name lookup fails (log warning: "No player found: {name}")
- Skip duplicate `(gameId, playerId)` pairs (the schema has a `@@unique` constraint)

**Records expected**: ~700+ GameParticipant records

---

## Entity Processing Order

```
OpponentTeam  (no FK dependencies)
     ↓
Tournament    (no FK dependencies)
     ↓
Player        (no FK dependencies; FK: invitedById is null for all imports)
     ↓
Contact       (FK: playerId → Player)
     ↓
Game          (FK: opponentTeamId → OpponentTeam, tournamentId → Tournament)
     ↓
GameParticipant (FK: gameId → Game, playerId → Player)
```

**Truncate order** (reverse of above):

```
GameParticipant → Statistics → Game → Contact → Player → Tournament → OpponentTeam
```

Note: `Statistics` is truncated (even though this import doesn't populate it) to safely clear any FK references before Player/Tournament are removed.

---

## State Transitions

| Entity            | Status field             | Imported value                                            | Notes                                           |
| ----------------- | ------------------------ | --------------------------------------------------------- | ----------------------------------------------- |
| `Player`          | `status: PlayerStatus`   | Always `ACTIVE`                                           | Admin deactivates retired players via CMS       |
| `Player`          | `playerType: PlayerType` | `GUEST` or `REGISTERED`                                   | Determined by name/nickname pattern             |
| `Game`            | `status: GameStatus`     | `COMPLETED` if Conclusión ∈ {G,P,E}; `SCHEDULED` if empty |                                                 |
| `GameParticipant` | `confirmationStatus`     | Always `CONFIRMED`                                        | Appearing in Apariciones = confirmed attendance |

---

## Lookup Map Types (TypeScript)

```typescript
type IdMap = Record<string, string>; // name/key → UUID

const opponentTeamMap: IdMap = {}; // 'La Cocina' → 'uuid-...'
const tournamentMap: IdMap = {}; // '2024 Amistoso' → 'uuid-...'
const playerMapByName: IdMap = {}; // 'diego marmol' → 'uuid-...'
const playerMapByNickname: IdMap = {}; // 'dieguito' → 'uuid-...'
const gameMap: IdMap = {}; // '2023-09-09:la cocina' → 'uuid-...'
```
