<script setup lang="ts">
import { computed } from "vue";
import type { PlayerStatRowDTO } from "@ministrosfc/shared";
import type { ColumnDef } from "~/types/table";

const props = defineProps<{
  rows: PlayerStatRowDTO[];
  mode: "all" | "single";
  loading: boolean;
}>();

const allColumns: ColumnDef[] = [
  {
    accessorKey: "name",
    header: "Jugador",
    title: "Jugador",
    sortable: true,
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
  { accessorKey: "goals", header: "Goles", title: "Goles", sortable: true },
  {
    accessorKey: "assists",
    header: "Asist.",
    title: "Asistencias",
    sortable: true,
  },
  {
    accessorKey: "goalRate",
    header: "PG",
    title: "Promedio de gol",
    sortable: true,
  },
  {
    accessorKey: "winRate",
    header: "Win%",
    title: "Porcentaje de Victorias",
    sortable: true,
  },
  {
    accessorKey: "participationRate",
    header: "Part.%",
    title: "Porcentaje de Participación",
    sortable: true,
  },
];

// Single-player mode reuses the same DTO fields — year/tournament/rival
// breakdown is not yet available in PlayerStatRowDTO.
const singleColumns: ColumnDef[] = [
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
  { accessorKey: "goals", header: "Goles", title: "Goles", sortable: true },
  {
    accessorKey: "assists",
    header: "Asist.",
    title: "Asistencias",
    sortable: true,
  },
  {
    accessorKey: "goalRate",
    header: "PG",
    title: "Promedio de gol",
    sortable: true,
  },
  {
    accessorKey: "winRate",
    header: "Win%",
    title: "Porcentaje de Victorias",
    sortable: true,
  },
  {
    accessorKey: "participationRate",
    header: "Part.%",
    title: "Porcentaje de Participación",
    sortable: true,
  },
];

const columns = computed(() =>
  props.mode === "all" ? allColumns : singleColumns,
);

const tableRows = computed(() =>
  props.rows.map((row) => ({
    playerId: row.playerId,
    name: row.playerName,
    nickname: row.playerNickname ?? null,
    games: row.gamesPlayed,
    wins: row.wins,
    losses: row.losses,
    draws: row.draws,
    goals: row.goals,
    assists: row.assists,
    goalRate: row.goalRate,
    winRate: row.winRate,
    participationRate: row.participationRate,
  })),
);
</script>

<template>
  <UiStatsTable :columns="columns" :rows="tableRows" :loading="loading">
    <template #name-data="{ row }">
      <div class="flex gap-x-2 items-baseline">
        <NuxtLink
          :to="`/players/${row.playerId}`"
          class="font-medium hover:text-brand transition-colors"
          >{{ row.name }}</NuxtLink
        >
        <span v-if="row.nickname" class="text-sm text-gray-400 italic">{{
          row.nickname
        }}</span>
      </div>
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
    <template #goalRate-data="{ row }">
      {{ row.goalRate != null ? Number(row.goalRate).toFixed(2) : "—" }}
    </template>
    <template #winRate-data="{ row }">
      {{ row.winRate != null ? Number(row.winRate).toFixed(1) : "—" }}%
    </template>
    <template #participationRate-data="{ row }">
      {{
        row.participationRate != null
          ? Number(row.participationRate).toFixed(1)
          : "—"
      }}%
    </template>
  </UiStatsTable>
</template>
