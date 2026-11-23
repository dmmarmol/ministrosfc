# Quickstart: Pre-release bugfixes validation

Use a local development environment or disposable/staging database. Do not validate database migration behavior against production data.

## Prerequisites

- Node.js >=23 and npm >=10.
- Workspace dependencies installed (`npm install`).
- For migration validation, a configured CMS `.env` pointing to a disposable PostgreSQL database and a restorable database snapshot.
- For browser workflows, CMS and frontend development environments configured according to the repository README.

## Automated checks

Run focused package checks after implementation:

```bash
npm run test --workspace=@ministrosfc/frontend -- --run
npm run test --workspace=@ministrosfc/cms -- --runInBand
npm run build --workspace=@ministrosfc/shared
npm run build --workspace=@ministrosfc/cms
npm run build --workspace=@ministrosfc/frontend
```

Validate the new Prisma migration against the disposable database using the repository's migration deployment script:

```bash
npm run prisma:deploy --workspace=@ministrosfc/cms
```

Confirm both Game and Tournament records formerly marked `SEASON` now read `LEAGUE`, and verify their IDs, dates, associations, scores, status, and other fields are unchanged. Also verify the resulting Prisma enum contains no `SEASON`.

## End-to-end scenarios

1. **Admin game save and freshness**
   - Create and edit a game with no `returnUrl`; confirm navigation to `/admin/games`.
   - Repeat with a valid internal return path; confirm that path is used.
   - Return to the game index and confirm the saved values appear without manual reload.
   - Try missing, malformed, absolute, and protocol-relative `returnUrl` values; confirm each uses the flow fallback.

2. **Nested team creation**
   - Enter game details and participants, open team creation, and create a team.
   - Confirm return to `/admin/games/create`, preservation of entered fields/participants, automatic selection of the new opponent team, and no game submission until the admin submits.
   - Confirm the temporary draft is cleared after restoration.

3. **Shared back navigation**
   - Check main admin back actions use the shared component.
   - Confirm a valid internal return path is honored and an invalid/missing path uses that page's configured fallback.

4. **Public roster**
   - Start from a specific status and enter a search; verify status becomes `Todos`, all registered-player statuses are searched, and guest players remain absent.
   - Clear the search and confirm `Todos` remains selected.
   - Select `Todos` without a search and confirm player status labels appear above cards.

5. **Competition types and dashboard**
   - Confirm forms, filters, and display labels contain only the canonical four competition types and no “Temporada”.
   - Confirm recent games render in the standard `UTable` pattern, the edit action targets `/admin/games/:id`, and the empty state remains usable.
   - Confirm the dashboard uses existing shared game/player composables where their contracts support the requested query.

6. **Dark theme and status labels**
   - With `.dark` on the root HTML element, inspect public and admin surfaces for readable text, borders, and backgrounds using the existing theme tokens.
   - Confirm end-user game status labels are Spanish and missing/unknown values render `Sin estado` or `Sin tipo` without breaking the view.

A repeatable, Chrome-driven version of these scenarios (with the regressions found during validation) is in `docs/guides/MANUAL_QA_CHROME.md`.
