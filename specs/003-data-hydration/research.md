# Research: Data Hydration from Google Sheets

**Feature**: 003-data-hydration | **Phase**: 0 | **Date**: March 23, 2026

---

## R-001 — CSV Parsing Library

**Decision**: `csv-parse` (specifically `csv-parse/sync` subpath)

**Rationale**:
- Ships its own TypeScript types (no separate `@types/*`)
- `csv-parse/sync` `parse()` gives a single synchronous call — pair with `fs/promises` for clean async/await
- `columns: true` maps rows directly to typed objects
- Handles all edge cases: quoted commas, embedded newlines, escaped quotes
- ~3M weekly downloads, actively maintained (part of the `csv` monorepo)

**Installation**:
```bash
npm install csv-parse --save-dev --workspace=@ministrosfc/cms
```
(dev-only — admin seeding script, not Express runtime code)

**Usage pattern**:
```typescript
import { readFile } from 'fs/promises';
import { parse } from 'csv-parse/sync';

async function loadCsv<T>(filePath: string): Promise<T[]> {
  const content = await readFile(filePath, 'utf-8');
  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as T[];
}
```

**Alternatives considered**:
- `papaparse` — browser-first; Node.js support is secondary; no native Promise API
- `fast-csv` — stream-only; overkill for a one-shot seeding script
- Native `line.split(',')` — breaks on quoted commas and embedded newlines; not reliable for real-world CSV

---

## R-002 — Prisma Bulk Insert Strategy

**Decision**: Interactive `$transaction` with `TRUNCATE … CASCADE` + `createMany` chunked to 500 rows

**Rationale**:
- `TRUNCATE CASCADE` is DDL-level and instantly clears all FK-chained tables — faster than chained `deleteMany`
- `createMany` is a single SQL `INSERT` per model — no N+1 queries
- Interactive transaction (`$transaction(async (tx) => {...})`) ensures full atomicity: if any insertion fails, the truncate rolls back
- Chunking at 500 rows stays well under PostgreSQL's 65k bind-parameter limit

**Key constraints**:
- `createMany` does **not** support nested writes (e.g., `Player` + `Contact` in one call)
- Solution: pre-generate UUIDs for `Player` records using `crypto.randomUUID()`, then insert `Contact` rows referencing those IDs in the same transaction
- Default interactive transaction timeout is 5,000ms — override to 60,000ms for bulk operations

**Code pattern**:
```typescript
await prisma.$transaction(
  async (tx) => {
    // 1. Truncate in reverse FK order
    await tx.$executeRaw`TRUNCATE "GameParticipant","Statistics","Game","Contact","Player","Tournament","OpponentTeam" CASCADE`;

    // 2. Insert in FK dependency order, chunked
    for (const batch of chunk(opponentTeams, 500)) {
      await tx.opponentTeam.createMany({ data: batch });
    }
    // ... tournaments, players, contacts, games, gameParticipants
  },
  { timeout: 60_000, maxWait: 5_000 }
);
```

**Gotchas**:
- `RESTART IDENTITY` in TRUNCATE not used — UUID primary keys, no sequences to reset
- `createMany` does not return created records by default; use a second `findMany` or pre-generate UUIDs to resolve FKs in subsequent inserts
- PostgreSQL bind-parameter limit: ~65,535 total. For a row with 10 columns, max batch = 6,553 rows. Keeping chunk at 500 is safe for any model width

---

## R-003 — ts-node Script Invocation in Monorepo

**Decision**: `ts-node --project tsconfig.json -r dotenv/config src/scripts/seed-import.ts` in `packages/cms`, delegated via `npm run seed:import --workspace=@ministrosfc/cms` from root

**Rationale**:
- npm workspaces automatically changes `cwd` to `packages/cms/` — dotenv finds `.env` there, ts-node finds `tsconfig.json`
- `-r dotenv/config` injects `DATABASE_URL` before any module is evaluated, including the Prisma client import
- `--project tsconfig.json` is explicit but not strictly required; defensive practice against accidental tsconfig resolution from a parent directory
- Existing `seed` script in the same package uses the same pattern (minus `-r dotenv/config`) — confirmed compatible

**Package.json additions needed**:

`packages/cms/package.json` — add script and dependency:
```json
{
  "scripts": {
    "seed:import": "ts-node --project tsconfig.json -r dotenv/config src/scripts/seed-import.ts"
  },
  "devDependencies": {
    "dotenv": "^16.0.0",
    "csv-parse": "^5.5.0"
  }
}
```

Root `package.json` — add delegating script:
```json
{
  "scripts": {
    "seed:import": "npm run seed:import --workspace=@ministrosfc/cms"
  }
}
```

**Gotchas**:
- `dotenv` is NOT currently in `packages/cms` deps — must be installed
- `dotenv` reads from `cwd` (i.e., `packages/cms/`) when invoked via workspace — running the script directly from repo root without `--workspace` will fail to find `.env`
- `DATABASE_URL` must be set in `packages/cms/.env` before running the script
- Prisma client must be generated first (`npm run gen:prisma`)

---

## R-004 — Tournament Year Disambiguation

**Decision**: Group games by `(Torneo + year(Fecha))` to create unique tournament names with year prefix

**Rationale**:
- The Historial.csv uses short tournament names (`Amistoso`, `Torneo Apertura`) that recur across years
- Schema requires tournament names to be unique within the database
- Year-prefixed names (`"2024 Amistoso"`, `"2025 Torneo Apertura"`) are human-readable and match the naming used in the statistics dashboard (`Estadisticas_Generales`)

**Derivation logic**:
1. First pass: iterate all game rows, extract `(Torneo, year(Fecha))` pairs
2. Group games by that pair
3. For each group: `name = "${year} ${Torneo}"`, `startDate = min(dates)`, `endDate = max(dates)`, `competitionType = mapped(Torneo)`

**CompetitionType mapping**:
| Torneo | CompetitionType |
|---|---|
| `Liga` | `LEAGUE` |
| `Torneo Apertura` | `SEASON` |
| `Torneo Clausura` | `SEASON` |
| `Torneo Mundialito` | `CUP` |
| `Copa de Oro` | `CUP` |
| `Amistoso` | `FRIENDLY` |

---

## R-005 — Position Enum Gap Resolution

**Decision**: Map sparse CSV positions to nearest schema enum; log unmapped positions as warnings

| CSV value | Schema enum | Rationale |
|---|---|---|
| `SMF` | `CMF` | Side-mid treated as central mid for now; schema has no `SMF` |
| `LIB` | `CB` | Libero/sweeper is a center-back role |

Multi-position handling: take the **first valid enum value** after splitting on `,`. Log positions 2-N in warning output (data is not lost — admin can update via CMS).

---

## R-006 — Game-to-Tournament FK Resolution

**Decision**: Build an in-memory lookup map keyed by `"${year} ${torneoShortName}"` after tournament insert

**Steps**:
1. Derive all `(Torneo + year)` pairs from Historial.csv
2. Insert tournaments, resolve their IDs via `createManyAndReturn` (Prisma 5.x PostgreSQL) or subsequent `findMany`
3. Build map: `{ "2024 Amistoso": "uuid-...", ... }`
4. When inserting each `Game`, compute ``${year} ${torneo}`` → look up `tournamentId` from map

**Opponent team FK**: Same pattern — insert all unique `Rival` names → build `{ "La Cocina": "uuid-...", ... }` map → use when inserting games.

---

## R-007 — Apariciones → GameParticipant Lookup Key

**Decision**: Composite key `ISO-date:rival-name-trimmed-lowercase`

**Rationale**:
- Apariciones dates are `YYYY/MM/DD` → convert to `YYYY-MM-DD` (replace `/` with `-`)
- Historial dates are `DD/MM/YYYY` → convert to `YYYY-MM-DD` during game import
- Both sides use the same canonical date, ensuring reliable lookups
- Rival name trimmed + lowercased to avoid whitespace/casing mismatch

**Player lookup**: by `name` (trimmed lowercase). Fallback: `nickname` (trimmed lowercase). If neither matches, log warning and skip the row.
