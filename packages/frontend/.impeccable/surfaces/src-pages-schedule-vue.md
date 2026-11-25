---
version: 1
slug: "src-pages-schedule-vue"
primary_target: "src/pages/schedule.vue"
related_targets: ["src/components/pages/schedule/GameLine.vue"]
---

---
version: 1
slug: "src-pages-schedule-vue"
primary_target: "src/pages/schedule.vue"
related_targets: ["src/components/pages/schedule/GameLine.vue"]
---

# Schedule (src/pages/schedule.vue)

Mode: Read. Phone first. Code-led. World: settled Team Sheet (DESIGN.md).

Audience and job: players and fans finding the next games and past results; filter by rival; open a game.

Content (real data only): scheduled games (Próximos) and completed games (Resultados), up to 50, grouped by month; each line shows weekday and day, rival, time and venue, and for played games the score and result word. A missing score shows a dash and "Sin resultado", never 0-0. No signup call to action (spec 023 FR-020).

Unresolved: dev data has repeated games and no upcoming game, so the populated Próximos tab was never captured; cancelled games are not listed (the page only queries scheduled and completed, as before); tournaments/[id] still uses the old GameCard.

## Direction contract

THESIS: The schedule is the club's fixture sheet: ruled lines grouped by month, each line one game, instead of a stack of cards.
OWN-WORLD: Black ink on white with one blue: month headings in display caps over a 3px rule, lines with a blue weekday, a big display day numeral, the rival in display caps, typewriter time and venue, and the score in display numerals with a blue result word; chips for the two views and a ruled rival filter.
STORY: A player switches between upcoming and results, narrows by rival, scans by month, and taps a line to open that game's sheet.
FIRST VIEWPORT (390x844): sheet header, "Calendario" in huge caps, the two view chips, the rival filter and the first month with its first lines.
FORM: Fixture sheet, an extension of the settled world. No structure roll was run and none of the maintainer's words pin this layout: the maintainer only wrote "Proceed with the schedule", so the chips, rival filter and month-grouped lines are the builder's choice, unconfirmed by the maintainer. seed: none (no roll).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
