<script setup lang="ts">
import { computed } from "vue";
import type { AllPlayersStatsRow } from "@ministrosfc/shared";
import StatsRanked, { type RankedItem, type RankedMetric } from "./StatsRanked.vue";

const { t } = useI18n();

const props = defineProps<{ rows: AllPlayersStatsRow[]; loading: boolean }>();

const pct = (v: number) => `${Number(v).toFixed(1)}%`;
const metrics: RankedMetric[] = [
  { key: "games", label: t("common.partidos"), unit: t("units.partidos") },
  { key: "goals", label: t("common.goles"), unit: t("units.goles") },
  { key: "assists", label: t("common.asist"), unit: t("units.asist") },
  { key: "winRate", label: t("stats.winRate"), unit: t("units.vict"), format: pct },
  { key: "participation", label: t("statisticsStatsTableByPlayer.presencia"), unit: t("statisticsStatsTableByPlayer.presente"), format: pct },
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
      { label: t("common.goles"), value: r.goals },
      { label: t("common.asist"), value: r.assists },
      { label: t("common.amar"), value: r.yellowCards },
      { label: t("common.rojas"), value: r.redCards },
    ],
  })),
);
</script>

<template>
  <StatsRanked :items="items" :metrics="metrics" :loading="loading" />
</template>
