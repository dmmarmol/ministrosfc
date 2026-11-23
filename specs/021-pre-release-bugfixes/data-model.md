# Data Model: Pre-release bugfixes

This feature primarily changes navigation, display, and filtering behavior. It adds no persistent domain entity or field. One existing enum value is normalized and removed; the in-progress game form draft is transient client state.

## Existing domain entities

### Game

- **Relevant fields**: `id`, `opponentTeamId`, `date`, `competitionType`, `status`, `tournamentId`, `playgroundId`, `maxPlayers`, and `participants`.
- **Relationships**: belongs to an opponent team; may belong to a tournament; has participant records.
- **Validation/state**:
  - `competitionType` must be one of the canonical supported values (`FRIENDLY`, `LEAGUE`, `CUP`, `PLAYOFF`).
  - Existing `SEASON` values are converted to `LEAGUE` without changing the row's other fields.
  - A draft returned from team creation remains unsaved until the admin submits the game form.

### Tournament

- **Relevant fields**: `id`, `name`, `competitionType`, `startDate`, and `endDate`.
- **Relationships**: may be referenced by games.
- **Validation/state**:
  - `competitionType` uses the same canonical supported enum as Game.
  - Existing `SEASON` values are converted to `LEAGUE`; the `Tournament` row and related game associations otherwise remain unchanged.

### CompetitionType

- **Canonical values after migration**:
  - `FRIENDLY` — Amistoso
  - `LEAGUE` — Liga
  - `CUP` — Copa
  - `PLAYOFF` — Playoff
- **Removed value**: `SEASON` — existing records are remapped before the DB enum and supported API/type definitions drop it.
- **Source of truth**: the shared enum in `packages/shared`; Prisma, API validation, forms, importers, and presentation must agree.
- **Display fallback**: missing or unsupported display values render `Sin tipo` instead of throwing or showing an ambiguous label.

### Player

- **Relevant fields**: `id`, `playerType`, `status`, and the display/search fields already present in the shared `Player`/`PlayerPublic` contracts.
- **Validation/filtering**:
  - Public roster results include registered players only; `GUEST` players are excluded.
  - A non-empty search behaves as status `Todos` and searches across both registered-player statuses.
  - Clearing search leaves the status selector at `Todos`.
  - Missing/unsupported status display values render `Sin estado`.
  - Existing shared player types and CMS endpoint response envelopes are reused; no duplicate DTO is introduced.

## Client-only navigation state

### ReturnNavigation

- **Input**: query parameter `returnUrl`, read through `useQueryParams`.
- **Accepted value**: a valid internal application path beginning with one `/`; it must not be a protocol-relative URL, external origin, malformed path, or unsafe path encoding.
- **Fallback**: the destination configured by the current flow; missing/invalid values do not change the fallback.
- **State transition**: parse/validate → navigate to accepted path or fallback.
- **Persistence**: query string only; no server-side persistence.

### GameCreationDraft

- **Fields**: the game creation form's current data (`opponentTeamId`, date/time, competition type, tournament/playground/max-player choices, and participant identifiers).
- **Storage/lifecycle**: tab-scoped `sessionStorage`; written before navigating to opponent-team creation; restored once upon valid return; cleared after consumption or explicit cancellation.
- **Post-return rule**: replace `opponentTeamId` with the newly created team ID; do not create or submit the game automatically.
- **Exclusions**: credentials, auth tokens, and unrelated application state.

### RosterFilterState

- **Fields**: status selection and search string, using existing URL/query behavior where applicable.
- **Transition**: entering non-empty search sets status to `OPTION_FILTER_ALL`; clearing search retains that value.
- **Selector event**: choosing `OPTION_FILTER_ALL` emits the `selected` event so the roster view can show card-level status labels.
- **Result scope**: all registered players matching the search, excluding guests.

## Derived dashboard view

The dashboard's recent games rows are a projection of the existing `Game` API response. Their columns/actions do not create or persist new entities; edit actions link to `/admin/games/:id`. Empty data remains a valid table/empty-state condition.
