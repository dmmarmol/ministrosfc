<script setup lang="ts">
import { computed } from "vue";
import { type TeamStatPeriodDTO } from "@ministrosfc/shared";
import { formatStatDate } from "~/utils/stats";
import type { ColumnDef } from "~/types/table";

const props = defineProps<{
  rows: TeamStatPeriodDTO[];
  loading: boolean;
}>();

const columns: ColumnDef[] = [
  { key: "tournament", label: "Torneo", title: "Torneo", sortable: true },
  { key: "year", label: "Año", title: "Año", sortable: true },
  { key: "period", label: "Período", title: "Período", sortable: false },
  { key: "games", label: "PJ", title: "Partidos Jugados", sortable: true },
  { key: "wins", label: "PG", title: "Partidos Ganados", sortable: true },
  { key: "losses", label: "PP", title: "Partidos Perdidos", sortable: true },
  { key: "draws", label: "PE", title: "Partidos Empatados", sortable: true },
  { key: "goalsFor", label: "GF", title: "Goles a Favor", sortable: true },
  {
    key: "goalsAgainst",
    label: "GC",
    title: "Goles en Contra",
    sortable: true,
  },
  {
    key: "goalDiff",
    label: "DG",
    title: "Diferencia de Goles",
    sortable: true,
  },
  {
    key: "goalRateFor",
    label: "GRF",
    title: "Ritmo Goleador a Favor",
    sortable: true,
  },
  {
    key: "goalRateAgainst",
    label: "GRC",
    title: "Ritmo Goleador en Contra",
    sortable: true,
  },
  { key: "points", label: "PTS", title: "Puntos", sortable: true },
  {
    key: "winRate",
    label: "Win%",
    title: "Porcentaje de Victorias",
    sortable: true,
  },
];

const tableRows = computed(() =>
  props.rows.map((row) => ({
    tournament: row.label,
    year: row.periodStart ? row.periodStart.slice(0, 4) : "—",
    period:
      row.periodStart && row.periodEnd
        ? `${formatStatDate(row.periodStart)} – ${formatStatDate(row.periodEnd)}`
        : "—",
    games: row.gamesPlayed,
    wins: row.wins,
    losses: row.losses,
    draws: row.draws,
    goalsFor: row.goalsFor,
    goalsAgainst: row.goalsAgainst,
    goalDiff: row.goalDifference,
    goalRateFor: row.goalRateFor,
    goalRateAgainst: row.goalRateAgainst,
    points: row.pointsEarned,
    winRate: row.winRate,
  })),
);
</script>

<template>
  <UiStatsTable :columns="columns" :rows="tableRows" :loading="loading">
    <template #wins-data="{ row }">
      <span class="text-green-600">{{ row.wins }}</span>
    </template>
    <template #losses-data="{ row }">
      <span class="text-red-500">{{ row.losses }}</span>
    </template>
    <template #draws-data="{ row }">
      <span class="text-yellow-500">{{ row.draws }}</span>
    </template>
    <template #goalDiff-data="{ row }">
      <span
        :class="
          Number(row.goalDiff) > 0
            ? 'text-green-600'
            : Number(row.goalDiff) < 0
              ? 'text-red-500'
              : ''
        "
      >
        {{ Number(row.goalDiff) > 0 ? "+" : "" }}{{ row.goalDiff }}
      </span>
    </template>
    <template #goalRateFor-data="{ row }">
      {{ Number(row.goalRateFor).toFixed(2) }}
    </template>
    <template #goalRateAgainst-data="{ row }">
      {{ Number(row.goalRateAgainst).toFixed(2) }}
    </template>
    <template #winRate-data="{ row }">
      {{ Number(row.winRate).toFixed(1) }}%
    </template>
  </UiStatsTable>
</template>
