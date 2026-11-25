---
version: 1
slug: "src-pages-roster-vue"
primary_target: "src/pages/roster.vue"
related_targets: ["src/pages/players/[id].vue"]
---

---
version: 1
slug: "src-pages-roster-vue"
primary_target: "src/pages/roster.vue"
related_targets: ["src/pages/players/[id].vue"]
---

# Roster and player profile (src/pages/roster.vue, src/pages/players/[id].vue)

Mode: Experience. Phone first, then desktop. Code-led. World: the settled Team Sheet (see DESIGN.md).

Audience and job: squad players and fans. Find a player or their own ficha fast; see dorsal, position, games, goals, assists at a glance; open a profile with career stats and year filter.

Content (real data only): photo (generic seeded avatars count as no photo), dorsal, name, nickname, position, PJ/G/A from the public statistics endpoint. No ratings, flags or abilities (spec 023 FR-015).

Unresolved: real photos do not exist in dev data; stats by rival table on the profile (authenticated) is not yet migrated; "Sin posición" group exists because positions are missing on some players.

## Direction contract

THESIS: The squad is a pile of fichas laid out in lines (arco, defensa, medio, ataque); the ficha, not a card template, is the unit and carries the whole system.
OWN-WORLD: Black ink on white with one blue for details: 3px ink borders, square corners, grayscale photos that regain color on hover, dorsal in a blue tab or set huge in ink when there is no photo, display caps for the surname, typewriter for the first name, ruled PJ/G/A strip, no shadows.
STORY: A player scans a line, spots a dorsal or surname, taps the ficha and lands on a large version with career stats scoped by year.
FIRST VIEWPORT (390x844): "Plantilla" in huge condensed caps, ruled search and position filters, then the first line heading with two-column fichas.
FORM: Fichas grid (card 2 of the dealt hand, user-chosen), seed:783546d07e65a464, dealt on the roster surface roll; challenger Pase y tablero judged competitive, others declined.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
