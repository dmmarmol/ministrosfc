# Competition Type API Contract

This feature changes the accepted `competitionType` values on existing CMS API resources; it does not add an endpoint or change response envelopes.

## Canonical values

`FRIENDLY`, `LEAGUE`, `CUP`, `PLAYOFF`

`SEASON` is no longer accepted by current API requests or emitted by the supported domain enum. Existing database records with `SEASON` are migrated to `LEAGUE` before the PostgreSQL enum is replaced.

## Existing API surfaces

### Games

- `GET /api/v1/games` — existing game listing.
- `POST /api/v1/games` — optional `competitionType` accepts one canonical value.
- `PATCH /api/v1/games/:id` — optional `competitionType` accepts one canonical value.

Game responses retain the existing `{ data: ... }` envelope and represent `competitionType` with the canonical enum.

### Tournaments

- `GET /api/v1/tournaments` — optional `competitionType` filter accepts one canonical value.
- `POST /api/v1/tournaments` — required `competitionType` accepts one canonical value.
- `PATCH /api/v1/tournaments/:id` — optional `competitionType` accepts one canonical value.

Tournament responses retain the existing `{ data: ... }` envelope and represent `competitionType` with the canonical enum.

## Compatibility and migration

- Requests containing `SEASON` after deployment are invalid.
- Database migration maps existing Game and Tournament `SEASON` rows to `LEAGUE` before dropping the old enum variant.
- The seed importer must not produce `SEASON`; source CSV alignment is coordinated separately by its owner.
- UI labels are sourced from the canonical enum and remain static Spanish text.
