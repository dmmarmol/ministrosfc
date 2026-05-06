<script setup lang="ts">
import { computed } from "vue";
import { type TeamStatPeriodDTO } from "@ministrosfc/shared";
import type { ColumnDef } from "~/types/table";

const props = defineProps<{
  rows: TeamStatPeriodDTO[];
  loading: boolean;
}>();

const columns: ColumnDef[] = [
  { accessorKey: "rival", header: "Rival", title: "Rival", sortable: true },
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
    title: "Diferencia de gol",
    sortable: true,
  },
  {
    accessorKey: "winRate",
    header: "Win%",
    title: "Porcentaje de Victorias",
    sortable: true,
  },
  {
    accessorKey: "playgroundName",
    header: "Cancha",
    title: "Cancha Más Frecuente",
    sortable: false,
  },
];

const tableRows = computed(() =>
  props.rows.map((row) => ({
    rival: row.label,
    rivalId: row.key,
    games: row.gamesPlayed,
    wins: row.wins,
    losses: row.losses,
    draws: row.draws,
    goalsFor: row.goalsFor,
    goalsAgainst: row.goalsAgainst,
    goalDiff: row.goalsFor - row.goalsAgainst,
    winRate: row.winRate,
    playgroundName: row.playgroundName ?? "—",
  })),
);
</script>

<template>
  <UiStatsTable :columns="columns" :rows="tableRows" :loading="loading">
    <template #rival-data="{ row }">
      <NuxtLink
        :to="`/statistics/rivals/${row.rivalId}`"
        class="font-medium hover:text-brand transition-colors"
        >{{ row.rival }}</NuxtLink
      >
    </template>
    <template #wins-data="{ row }">
      <span class="text-green-600">{{ row.wins }}</span>
    </template>
    <template #losses-data="{ row }">
      <span class="text-red-500">{{ row.losses }}</span>
    </template>
    <template #draws-data="{ row }">
      <span class="text-yellow-500">{{ row.draws }}</span>
    </template>
    <template #winRate-data="{ row }">
      {{ Number(row.winRate).toFixed(1) }}%
    </template>
  </UiStatsTable>
</template>
