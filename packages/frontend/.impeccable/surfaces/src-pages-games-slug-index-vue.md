---
version: 1
slug: "src-pages-games-slug-index-vue"
primary_target: "src/pages/games/[slug]/index.vue"
related_targets: ["src/components/pages/games/GameSheet.vue"]
---

---
version: 1
slug: "src-pages-games-slug-index-vue"
primary_target: "src/pages/games/[slug]/index.vue"
related_targets: ["src/components/pages/games/GameSheet.vue"]
---

# Game detail (src/pages/games/[slug]/index.vue)

Mode: Read. Phone first. Code-led. World: settled Team Sheet (DESIGN.md). The detail page is the same sheet as the home's next game, in a detail mode (GameSheet with `detail`).

Audience and job: players and fans opening a game from the schedule, results or a chat link: who played, the score, who scored, where and when.

Content (real data only): rival, date, time, venue, competition, state, score (only when both scores are recorded), participants with dorsal, position and G/A/TA/TR when completed; guests only as "Invitado de {name}". No signup call to action (spec 023 FR-020); the hidden reserved slot stays behind `signupCtaEnabled`.

Unresolved: the lineup/formation field exists in code (GameLineupField) but was never shown on this public page and is not added here; signed-in signup route (/games/:slug/signup) keeps the old look until the auth flows migrate.

## Direction contract

THESIS: The detail page is the game's own team sheet: the same planilla as the home, opened to its full record (score, players, stats), never a different template.
OWN-WORLD: Black ink on white, one blue for details: ruled state/date/venue/competition strip, a huge display score with the result word, ruled lines with blue dorsal numbers, position tags, and small ink-bordered G/A/TA/TR tags; SUSPENDIDO stamp with struck lines when called off.
STORY: A visitor reads who the rival was, when and where, the score and its result, then scans the players and taps one for their ficha; a missing score is stated, never shown as 0-0.
FIRST VIEWPORT (390x844): back link to Calendario, the rival in huge caps, the ruled strip, the score (or the not-loaded notice) and the start of the player list.
FORM: Sheet in detail mode (extension of the stage-1 sheet; no structure roll), seed: none (pinned) by the maintainer, who wrote "Proceed with the game detail page" after approving the settled Planilla en Triplicado world.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
