<script setup lang="ts">
import { computed } from "vue";
import type { AllPlayersStatsRow } from "@ministrosfc/shared";
import StatsRanked, { type RankedItem, type RankedMetric } from "./StatsRanked.vue";

const props = defineProps<{ rows: AllPlayersStatsRow[]; loading: boolean }>();

const pct = (v: number) => `${Number(v).toFixed(1)}%`;
const metrics: RankedMetric[] = [
  { key: "games", label: "Partidos", unit: "partidos" },
  { key: "goals", label: "Goles", unit: "goles" },
  { key: "assists", label: "Asist.", unit: "asist." },
  { key: "winRate", label: "% Victorias", unit: "% vict.", format: pct },
  { key: "participation", label: "Presencia", unit: "% presente", format: pct },
];

const items = computed<RankedItem[]>(() =>
  props.rows.map((r) => ({
    id: r.playerId,
    title: r.playerName,
    subtitle: r.playerNickname ? `“${r.playerNickname}”` : undefined,
    position: r.position,
    to: `/players/${r.playerId}`,
    linkLabel: `Ver ficha de ${r.playerName}`,
    values: {
      games: r.gamesPlayed,
      goals: r.goals,
      assists: r.assists,
      winRate: r.winRate,
      participation: r.participationRate,
    },
    detail: [
      { label: "PJ", value: r.gamesPlayed },
      { label: "PG", value: r.wins },
      { label: "PE", value: r.draws },
      { label: "PP", value: r.losses },
      { label: "Goles", value: r.goals },
      { label: "Asist.", value: r.assists },
      { label: "Amar.", value: r.yellowCards },
      { label: "Rojas", value: r.redCards },
    ],
  })),
);
</script>

<template>
  <StatsRanked :items="items" :metrics="metrics" :loading="loading" />
</template>
