<script setup lang="ts">
import { computed } from "vue";
import type { TeamStatPeriodDTO } from "@ministrosfc/shared";
import { formatStatDate } from "~/utils/stats";
import StatsRanked, { type RankedItem, type RankedMetric } from "./StatsRanked.vue";

const props = defineProps<{ rows: TeamStatPeriodDTO[]; loading: boolean }>();

const pct = (v: number) => `${Number(v).toFixed(1)}%`;
const signed = (v: number) => (v > 0 ? `+${v}` : String(v));
const metrics: RankedMetric[] = [
  { key: "points", label: "Puntos", unit: "puntos" },
  { key: "wins", label: "Victorias", unit: "victorias" },
  { key: "games", label: "Partidos", unit: "partidos" },
  { key: "winRate", label: "% Victorias", unit: "% vict.", format: pct },
  { key: "goalDiff", label: "Dif. gol", unit: "dif. gol", format: signed },
];

const period = (r: TeamStatPeriodDTO) =>
  r.periodStart && r.periodEnd
    ? `${formatStatDate(r.periodStart)} – ${formatStatDate(r.periodEnd)}`
    : null;

const items = computed<RankedItem[]>(() =>
  props.rows.map((r) => ({
    id: r.key,
    title: r.label,
    subtitle: [r.periodStart ? r.periodStart.slice(0, 4) : null, period(r), r.playgroundName].filter(Boolean).join(" · "),
    
    values: {
      points: r.pointsEarned,
      wins: r.wins,
      games: r.gamesPlayed,
      winRate: r.winRate,
      goalDiff: r.goalDifference ?? r.goalsFor - r.goalsAgainst,
    },
    detail: [
      { label: "PJ", value: r.gamesPlayed },
      { label: "PG", value: r.wins },
      { label: "PE", value: r.draws },
      { label: "PP", value: r.losses },
      { label: "GF", value: r.goalsFor },
      { label: "GC", value: r.goalsAgainst },
      { label: "DG", value: signed(r.goalDifference ?? r.goalsFor - r.goalsAgainst) },
      { label: "% Vict.", value: pct(r.winRate) },
    ],
  })),
);
</script>

<template>
  <StatsRanked :items="items" :metrics="metrics" :loading="loading" natural />
</template>
