# Quickstart: Game Signup Invitation (014)

**Branch**: `chore/014-game-signup-invitation`

## Prerequisites

- Docker / Podman running: `docker compose up -d db redis`
- Dependencies installed: `npm install` from workspace root
- Environment: `.env.local` in `packages/cms/` and `packages/frontend/` (see README)

## Development Workflow

### 1. Start services

```bash
# From workspace root
npm run dev:all
```

- CMS runs on `http://localhost:5102`
- Frontend runs on `http://localhost:5103`

### 2. Apply the database migration

After generating the Prisma migration (see tasks.md):

```bash
cd packages/cms
npx prisma migrate dev --name add_game_signup_fields
npx prisma generate
```

### 3. Backfill slugs for existing games

After migration, run the slug backfill script:

```bash
cd packages/cms
npx ts-node --project tsconfig.json src/scripts/backfill-game-slugs.ts
```

### 4. Test the signup flow end-to-end

1. As Admin, create or edit a game — set **Cupo máximo** and **Formación**
2. Copy the "Copiar link de convocatoria" URL from the game admin page
3. Open the link in a new browser tab (unauthenticated) → should redirect to login
4. Log in as a PLAYER → should land on the Game Sign Up Page
5. Click confirm on the pre-filled `DropdownAddMore` row → verify roster update
6. Select "Agregar invitado" → type a guest name → confirm → verify guest row appears
7. Select an existing unconfirmed player → confirm → verify "Agregado por:" label

### 5. Test old UUID redirect

```bash
curl -I http://localhost:5103/games/<existing-game-uuid>
# Expect: HTTP 301, Location: /games/<slug>
```

### 6. Test robots.txt

```bash
curl http://localhost:5103/robots.txt
# Expect: Disallow: /games/*/signup
```

### 7. Run unit tests

```bash
# CMS
cd packages/cms && npm test -- --testPathPattern="game|participant|slug"

# Frontend
cd packages/frontend && npm run test -- --reporter=verbose
```

## Key Files

| File                                                        | Purpose                                                   |
| ----------------------------------------------------------- | --------------------------------------------------------- |
| `packages/cms/prisma/schema.prisma`                         | DB schema — `Game.maxPlayers`, `Game.slug`, `Game.lineup` |
| `packages/cms/src/utils/slug.ts`                            | Slug generation + normalization utility                   |
| `packages/cms/src/services/ParticipationService.ts`         | Trimodal signup logic, capacity gate                      |
| `packages/cms/src/routes/participants.ts`                   | `POST /signup` + `DELETE /:participantId`                 |
| `packages/cms/src/routes/games.ts`                          | Modified create/update schemas + slug endpoint            |
| `packages/shared/src/types/game.ts`                         | `FORMATIONS`, `FormationCode`, `Game` extensions          |
| `packages/shared/src/types/game-participant.ts`             | `SignupRequestDTO`, `RosterEntry`, `GameSignupPageDTO`    |
| `packages/frontend/src/pages/games/[slug].vue`              | Public game detail page (renamed from `[id].vue`)         |
| `packages/frontend/src/pages/games/[slug]/signup.vue`       | Game Sign Up Page                                         |
| `packages/frontend/server/routes/robots.txt.ts`             | robots.txt server route                                   |
| `packages/frontend/server/middleware/game-uuid-redirect.ts` | UUID → slug 301 redirect                                  |
| `packages/frontend/src/composables/useGameSignup.ts`        | Signup state + trimodal logic                             |
| `packages/frontend/src/components/game/GameLineupField.vue` | SVG field visualization                                   |
| `packages/frontend/src/utils/formations.ts`                 | 14-formation slot lookup table                            |

## Troubleshooting

**Slug generation fails for existing game (null slug)**  
Run the backfill script or set a `slug` manually via `prisma studio`.

**`DropdownAddMore` shows no proxy player options**  
Ensure the game has unconfirmed REGISTERED ACTIVE players. The proxy list filters by `playerType=REGISTERED`, `status=ACTIVE`, `confirmationStatus≠CONFIRMED` for this specific `gameId`.

**422 on signup despite game being SCHEDULED**  
Check `game.status` in the DB. The status gate checks `=== 'SCHEDULED'` exactly; `IN_PROGRESS` also blocks signup.

**Old UUID URL not redirecting**  
Confirm the Nuxt server middleware `game-uuid-redirect.ts` is in `packages/frontend/server/middleware/`. The UUID regex pattern: `/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i`.
