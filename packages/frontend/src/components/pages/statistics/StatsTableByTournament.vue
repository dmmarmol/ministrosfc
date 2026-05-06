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
  {
    accessorKey: "tournament",
    header: "Torneo",
    title: "Torneo",
    sortable: true,
  },
  { accessorKey: "year", header: "Año", title: "Año", sortable: true },
  {
    accessorKey: "period",
    header: "Período",
    title: "Período",
    sortable: false,
  },
  {
    accessorKey: "games",
    header: "PJ",
    title: "Partidos Jugados",
    sortable: true,
  },
  {
    accessorKey: "wins",
    header: "PG",
    title: "Partidos Ganados",
    sortable: true,
  },
  {
    accessorKey: "losses",
    header: "PP",
    title: "Partidos Perdidos",
    sortable: true,
  },
  {
    accessorKey: "draws",
    header: "PE",
    title: "Partidos Empatados",
    sortable: true,
  },
  {
    accessorKey: "goalsFor",
    header: "GF",
    title: "Goles a Favor",
    sortable: true,
  },
  {
    accessorKey: "goalsAgainst",
    header: "GC",
    title: "Goles en Contra",
    sortable: true,
  },
  {
    accessorKey: "goalDiff",
    header: "DG",
    title: "Diferencia de Goles",
    sortable: true,
  },
  {
    accessorKey: "goalRateFor",
    header: "GRF",
    title: "Ritmo Goleador a Favor",
    sortable: true,
  },
  {
    accessorKey: "goalRateAgainst",
    header: "GRC",
    title: "Ritmo Goleador en Contra",
    sortable: true,
  },
  { accessorKey: "points", header: "PTS", title: "Puntos", sortable: true },
  {
    accessorKey: "winRate",
    header: "Win%",
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
