---
version: 1
slug: "src-pages-tournaments-index-vue"
primary_target: "src/pages/tournaments/index.vue"
related_targets: ["src/pages/tournaments/[id].vue"]
---

# Tournaments (src/pages/tournaments/index.vue and [id].vue)

Mode: Read. Phone first. Code-led. World: settled Team Sheet (DESIGN.md).

Audience and job: players and fans browsing the club's tournaments, then opening one to see its record, games and scorers.

Content (real data only): list rows carry name, format and date range, plus a blue "En curso" or "Próximo" state when the dates say so. The list endpoint returns no record, so no record is shown there. The detail page shows the record (played, wins, draws, losses, goals for and against, goal difference), the games of the tournament and a scorers ranking.

## Direction contract

THESIS: Tournaments are the club's season sheets: a ruled register by year, each tournament one line, then one sheet per tournament.
OWN-WORLD: Settled world, no new tokens. Ink band per year, display-caps names over a typewriter format and date line, blue arrow and state word; format chips as filters; the detail reuses the record grid, the ink-band sections, GameLine rows grouped by month and the ranked rows.
STORY: A visitor picks a format chip or scans years, taps a tournament, reads its record at a glance, then its games and scorers.
FIRST VIEWPORT (390x844): sheet header with "Torneos" in the nav, "Torneos" in huge caps, format chips, the first year band and its first rows.
FORM: Extension of the settled world; the maintainer asked only to redesign both pages, so the layout is the builder's choice, unconfirmed.

Fixed along the way (the old pages never worked): the list was the parent route of the detail and never rendered it (moved to tournaments/index.vue); the detail read `games`, `topScorers` and `format`, none of which the API returns (now games come from /games?tournamentId, scorers from playerStats, type from competitionType).

Not run: the impeccable finish review subagent; "Inicio" is hidden from the phone nav to fit "Torneos" (the logo is the home link).
