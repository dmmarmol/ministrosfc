---
version: 1
slug: "src-pages-statistics-index-vue"
primary_target: "src/pages/statistics/index.vue"
related_targets: ["src/pages/statistics/top-scorers.vue","src/pages/statistics/years.vue","src/pages/statistics/rivals/index.vue","src/pages/statistics/rivals/[id].vue","src/pages/statistics/tournaments.vue","src/pages/statistics/players/index.vue"]
---

---
version: 1
slug: "src-pages-statistics-index-vue"
primary_target: "src/pages/statistics/index.vue"
related_targets: ["src/pages/statistics/top-scorers.vue","src/pages/statistics/years.vue","src/pages/statistics/rivals/index.vue","src/pages/statistics/rivals/[id].vue","src/pages/statistics/tournaments.vue","src/pages/statistics/players/index.vue"]
---

# Statistics (src/pages/statistics/*)

Mode: Operate/Read (tables become ranked rows). Phone first. Code-led. World: settled Team Sheet (DESIGN.md).

Audience and job: squad players (and fans for the public pages). Compare players, rivals, years and tournaments; see who scores most; open a ficha or a rival history.

Content: existing statistics endpoints (top scorers, all-player stats, team by year / tournament / rival, rival detail, team summary). Team views require sign-in. No data is invented.

Unresolved: the signed-in pages were verified with a faked session and synthetic rows shaped like the DTOs (team endpoints are 401 without login); Nuxt UI select menus keep their own popover internals, themed through CSS variables.

## Direction contract

THESIS: Every statistics table becomes ranked ruled rows with ONE headline number; chips decide what that number means and a tap opens the remaining columns.
OWN-WORLD: Black ink on white with one blue: ruled lines, display surnames, a single big numeral with a bar scaled to the leader, 3px ink chips and fields, section tabs under the header (wrapping, not scrolling), square corners, no shadows.
STORY: A player lands on a view, sees the order at a glance, switches the metric with a chip, taps a row for the full line and follows a link to a ficha or a rival history.
FIRST VIEWPORT (390x844): sheet header, section tabs, the view title in huge caps, a ruled filter bar, the sort chips, and the first ranked rows.
FORM: Ranked rows (structure approved by the maintainer from a visual mockup of the idea; the surface is an extension of the settled world, so no structure roll was run), seed: none (pinned) by the maintainer, who answered "Approve" to the Ranked Rows mockup after choosing the Planilla en Triplicado world.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
