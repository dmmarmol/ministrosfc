<script setup lang="ts">
import { computed } from "vue";
import { type TeamStatPeriodDTO, formatDate } from "@ministrosfc/shared";
import type { ColumnDef } from "~/types/table";

const props = defineProps<{
  rows: TeamStatPeriodDTO[];
  loading: boolean;
}>();

const columns: ColumnDef[] = [
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
    year: row.label,
    period:
      row.periodStart && row.periodEnd
        ? `${formatDate(row.periodStart, { month: "short", year: "numeric" })} – ${formatDate(row.periodEnd, { month: "short", year: "numeric" })}`
        : "—",
    games: row.gamesPlayed,
    wins: row.wins,
    losses: row.losses,
    draws: row.draws,
    goalsFor: row.goalsFor,
    goalsAgainst: row.goalsAgainst,
    goalDiff: row.goalDifference,
    points: row.pointsEarned,
    winRate: row.winRate,
  })),
);
</script>

<template>
  <StatsTable :columns="columns" :rows="tableRows" :loading="loading">
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
    <template #winRate-data="{ row }">
      {{ (Number(row.winRate) * 100).toFixed(1) }}%
    </template>
  </StatsTable>
</template>
