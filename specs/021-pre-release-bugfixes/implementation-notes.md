# Implementation notes: Pre-release bugfixes (spec 021)

Handoff document for any agent or developer returning to this feature. It records what shipped, where it lives, how it differs from the original spec, the regressions found while validating, and what is still open. Read this **after** `spec.md` (intent) and **before** changing related code.

- **Branch / PR**: `021-pre-release-bugfixes` → `main`, https://github.com/dmmarmol/ministrosfc/pull/5 (title `fix(pre-release-bugfixes): fix game save flow, roster filters and dark mode`)
- **Release**: 0.13.0 (minor) for the root and `@ministrosfc/{cms,frontend,shared}`. Changelog entries are in all four `CHANGELOG.md` files. No git tag was created.
- **Status**: All tasks T001–T032 complete. Validation results are at the bottom.
- **Manual QA**: repeatable browser runbook in `docs/guides/MANUAL_QA_CHROME.md` (setup, ground rules, scenarios S1–S7).

## 1. What shipped, by user story

| Story | Behavior | Main code |
|---|---|---|
| Foundation | Safe `returnUrl` resolver: internal paths only; missing, malformed, absolute, `//` and `\` values fall back to the flow's default. Reads go through `useQueryParams`. | `packages/frontend/src/utils/returnUrl.ts`, `composables/useQueryParams.ts` |
| US1 | Saving a game returns to a valid `returnUrl` or `/admin/games`; the list refetches fresh data. | `pages/admin/games/create.vue`, `[id]/index.vue`, `index.vue` |
| US2 | Creating an opponent team from the unfinished game form restores date, time, cupo, competition type, tournament and participants, selects the new team, consumes the draft, and does not submit the game. Draft lives in tab-scoped `sessionStorage` (`admin-game-creation-draft`). | `utils/gameCreationDraft.ts`, `pages/admin/teams/create.vue`, `components/pages/admin/games/GameForm.vue` |
| US2b | One shared back component for admin pages. | `components/ui/BackButton.vue` (`UiBackButton`) |
| US3 | Public roster: a non-empty search switches the status to "Todos" and searches all registered players; clearing keeps "Todos"; status label above each card only in "Todos"; guests excluded. The status dropdown renders only for signed-in users. | `pages/roster.vue`, `utils/roster.ts`, `components/ui/Player/Status/Select.vue` |
| US4 | `CompetitionType.SEASON` removed; migration converts existing `Game`/`Tournament` rows to `LEAGUE`; seed-import maps no longer emit `SEASON`; Spanish labels from one map. | `packages/shared/src/types/game.ts` (`competitionTypeLabels`), `packages/cms/prisma/migrations/20261104150000_remove_season_competition_type/`, `packages/cms/src/scripts/seed-import/transformers/competitionTypes.ts` |
| US5 | Dark mode legible on public and admin (see §3). | `packages/frontend/src/assets/theme.css`, `app.config.ts`, `layouts/*.vue` |
| US6 | Dashboard "Partidos recientes" is a `UTable`; edit action opens `/admin/games/:id`; `usePlayers` composable added; dashboard uses `useGames`/`usePlayers`. | `components/pages/admin/dashboard/RecentGamesTable.vue`, `pages/admin/dashboard.vue`, `composables/usePlayers.ts` |

## 2. Deviations from the original spec

These are intentional. If `spec.md` and the code disagree, the code in the PR is the current truth.

1. **Fallback labels.** The spec says missing or unrecognized values show "Sin especificar". The implementation (and `plan.md`) uses **"Sin estado"** for game/player status and **"Sin tipo"** for competition type.
2. **Dark mode scope.** The spec assumed no separate theme choice. We **added an icon-only toggle** (`components/ui/ColorModeToggle.vue`, `UiColorModeToggle`) in the public nav and the admin header, built on Nuxt UI's color mode (`useColorMode`, persisted in `localStorage['nuxt-color-mode']`).
3. **Brand color in dark mode.** Dark mode **keeps the blue brand** (`#4f72e2`); it used to switch to gold. White text sits on brand backgrounds. Where small blue text would have low contrast, the brand is used as a background instead (active nav link is a blue pill).
4. **Spanish API messages (not in the spec).** All CMS error and validation messages, including Multer errors and CSV import warnings, are now in Spanish (`middleware/validation.ts` `formatValidationIssue`, `middleware/error-handler.ts`). Tests that asserted English text were updated.
5. **Release bump.** The branch includes the 0.13.0 version bump and changelog entries, which the new `create-pr` skill requires.

## 3. How dark mode works (read before touching colors)

- `theme.css` defines tokens on `:root` and overrides them under `[data-theme="dark"], .dark`.
- Under `.dark` the **Tailwind gray scale is remapped** (`--color-gray-50…900`), so existing `text-gray-*`, `bg-gray-*` and `border-gray-*` utilities adapt without edits. `gray-400` stays mid-tone so it reads on both light and dark surfaces.
- Semantic tokens: `bg-surface` (cards, replaces `bg-white`), `bg-ink` (always-dark chrome such as the nav, footer and game headers, replaces `bg-gray-900/800`), `text-on-brand` (text on `bg-brand`).
- Color scales (`brand-*`, `primary-*`, `secondary-*`, `tertiary-*`) tint toward `var(--surface)`, not literal white, so tints are dark in dark mode.
- The admin sidebar stays dark in both themes (`--admin-ui-sidebar-bg`); its nav buttons use `bg-white/10`.
- **Guard test**: `src/assets/__tests__/theme.test.ts` fails if `bg-white`, `bg-gray-900` or `bg-gray-800` appear in components, pages or layouts. Use the tokens instead. Only the semantic tokens above should carry raw colors.

## 4. Regressions found while validating (all fixed, all with tests)

These were not in the original QA list. Each was found by driving the real app in Chrome.

| # | Symptom | Root cause | Fix / test |
|---|---|---|---|
| 1 | Editing a game moved its date/time by the UTC offset (+3h in UTC-3) on **every** save. | `formatDateInput`/`formatTimeInput` sliced the API's `…Z` string, while `toISOWithOffset` re-applied the local offset on save. | Convert tz-bearing values to local time. `packages/shared/src/utils/datetime.ts`; round-trip test in `utils/__tests__/datetime-inputs.test.ts`. |
| 2 | After creating a team from the game form the app stayed on `/admin/teams/create` and the `returnUrl` redirect never ran. | `OpponentTeamForm`, `PlaygroundForm`, `TournamentForm` used `@submit` without `.prevent`; the native submit reloaded the page mid-request. | `@submit.prevent`; `components/pages/admin/__tests__/form-submit-prevent.test.ts` covers every admin `*Form.vue`. |
| 3 | The new team appeared in the game form as a raw UUID; teams past the first 20 were unselectable. | `/api/v1/opponent-teams` paginates (default 20, max 100) and `fetchOpponentTeams` never paged. | Walk all pages with `limit=100`. `composables/useOpponentTeams.ts`; `composables/__tests__/useOpponentTeams.test.ts`. |
| 4 | Dashboard crashed after login: `Cannot read properties of undefined (reading 'map')`. | The games list returns `confirmedCount`, not `participants`. | Table shows the count and tolerates a missing array. |
| 5 | SEASON-removal migration swapped column defaults (`Game`=LEAGUE, `Tournament`=FRIENDLY; schema says the reverse). | Mistake in the migration's `SET DEFAULT` statements. | Corrected. Caught by `prisma migrate diff --exit-code`. |
| 6 | Home page overflowed horizontally at 320px. | Fixed `text-6xl` hero heading. | `text-4xl sm:text-6xl break-words`. |
| 7 | A csv-import test asserted the English warning text. | Spanish localization changed it. | Assertion updated. |

## 5. Other changes made on this branch

- **Copilot assets moved into `.claude/`** (commit `808ccba`): `skills/` (git-commit, create-release, create-pr, tailwindcss, unit-test-vue-pinia, web-coder), `commands/speckit.*.md` (spec-kit slash commands, e.g. `/speckit.plan`), `agents/ministrosfc-*.md` (subagents), `rules/*.md` (path-scoped conventions). The prompt stubs were deleted. `AGENTS.md` points at the new paths.
- **New `create-pr` skill** (`.claude/skills/create-pr/SKILL.md`): conventional title with the main feature in parentheses; body `# Summary` / `## Why` / `## Changes` / `## Documentation` (conditional); pre-flight requires a CHANGELOG entry and a version bump against the base.
- **`AGENTS.md`** created from `.github/copilot-instructions.md` (which is intentionally left until a later branch deletes it).

## 6. Validation performed

- Builds: shared, CMS, frontend pass.
- Tests: frontend Vitest 389 passing; shared Jest 15; CMS Jest 500 passing, 1 skipped. The CMS full run is occasionally flaky (CORS preflight, csv-import, game-dt-permissions); each passes when run alone.
- Migration on a throwaway database (not the dev DB): `SEASON` rows became `LEAGUE`, all other columns unchanged, enum is `{FRIENDLY,LEAGUE,CUP,PLAYOFF}`, defaults correct, `prisma migrate diff` reports no difference.
- Chrome (at `https://localhost.ministrosfc.com:5103`): S1–S6 of the runbook, dark mode toggle, responsive checks at 320/375/768px via hidden iframes.
- Not tested in a browser: the competition-type dropdown options in the admin forms (covered by `competition-type.test.ts` and a grep showing no `Temporada`/`SEASON` left outside tests), and the toggle's effect on every admin page (tokens are shared).

## 7. Open items and gotchas for the next agent

- **spec-kit integration still says `copilot`**: `.specify/integrations/copilot.manifest.json`, `integration.json` and `init-options.json` list the old `.github/agents|prompts` paths. A spec-kit upgrade may recreate files in `.github/`. Switch the integration to `claude` to make `.claude/commands` the managed location.
- **`apm.yml` / `apm.lock.yaml`** still track three skills under `.github/skills/`; APM will not find them after the move.
- **`CLAUDE.md` does not exist.** Claude Code reads `CLAUDE.md`, not `AGENTS.md`. A one-line `CLAUDE.md` with `@AGENTS.md` would make the instructions load automatically.
- **`.github/copilot-instructions.md`** remains until a later branch deletes it; its paths were updated to `.claude/skills/`.
- **Frontend lint** has 2 pre-existing errors (Nuxt auto-import `no-undef` in `app.config.ts` and `components/game/GameMetadataRow.vue`) and about 100 warnings.
- **Source CSV**: its owner must remove the "Temporada" value so it cannot be re-imported (the repo's import maps no longer emit `SEASON`). The migration is not reversible for rows already converted.
- **Base branch**: the repo default is `main`, but `develop` is ahead of it. PR #5 targets `main` and therefore also carries `develop`-only commits.
- **Console noise** that is pre-existing and harmless: Nuxt hydration mismatch warnings, `Failed to resolve component: PageLoading` on `/admin/teams`.
- **Remaining low-contrast text**: small blue text (for example "Ver calendario completo →", top-scorer numbers) is about 4.3:1 on dark surfaces, slightly under the 4.5:1 target in FR-008. Quick actions on the admin dashboard still use bright neutral/blue solid buttons.

## 8. Environment gotchas (for running QA)

- Frontend is served over **HTTPS** at `https://localhost.ministrosfc.com:5103`; CMS at `http://localhost:5102`. `curl http://localhost:5103` fails.
- Start services with `podman machine start`, `npm run docker:up`, `npm run dev:all`. Jest uses the separate `ministrosfc_test` database.
- Claude in Chrome: `resize_window` does not give a reliable phone viewport; use same-origin iframes of the target width. A tab can freeze after heavy scripts; open a fresh tab.
- `gh` has two accounts logged in; `dmmarmol` has access to the repo, `redacted` (an enterprise-managed account) does not.
