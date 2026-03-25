# @ministrosfc/cms

Express + Prisma CMS backend for Ministros FC.

---

## seed:import — CSV Data Import

Bulk-import historical match and player data from three CSV files into the database.

### Prerequisites

- A running PostgreSQL instance with `DATABASE_URL` set in `packages/cms/.env`
- CSV export files placed in `packages/cms/data/imports/` (this directory is git-ignored)

### Required Files

| File | Description |
|------|-------------|
| `Historial.csv` | Match history (date, rival, tournament, result…) |
| `Jugadores.csv` | Player roster (name, position, date of birth, phone…) |
| `Apariciones.csv` | Per-game player appearances (goals, cards, starter/sub…) |

The import is **idempotent** — running it multiple times truncates the relevant tables and re-inserts, always leaving the database in the same final state.

### Commands

```bash
# Standard import (reads from packages/cms/data/imports/)
npm run seed:import

# Preview what would be inserted — no database writes
npm run seed:import -- --dry-run

# Import from a custom directory
npm run seed:import -- --input /path/to/csv/dir

# Verbose output (print skipped-row warnings to stderr)
npm run seed:import -- --verbose
```

### Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | Missing required CSV file(s) |
| `2` | CSV parse error |
| `3` | Database connection error |
| `4` | Database transaction error |

### Notes

- The `.env` file must be present before running; `dotenv/config` is loaded automatically via the npm script.
- For full integration details and data-model mapping, see [`specs/003-data-hydration/quickstart.md`](../../specs/003-data-hydration/quickstart.md).
