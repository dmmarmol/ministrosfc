<script setup lang="ts">
import { computed } from "vue";
import { type TeamStatPeriodDTO } from "@ministrosfc/shared";
import type { ColumnDef } from "~/types/table";

const props = defineProps<{
  rows: TeamStatPeriodDTO[];
  loading: boolean;
}>();

const columns: ColumnDef[] = [
  { key: "rival", label: "Rival", title: "Rival", sortable: true },
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
    title: "Diferencia de gol",
    sortable: true,
  },
  {
    key: "winRate",
    label: "Win%",
    title: "Porcentaje de Victorias",
    sortable: true,
  },
  {
    key: "playgroundName",
    label: "Cancha",
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
