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
  { key: "name", label: "Jugador", title: "Jugador", sortable: true },
  { key: "games", label: "PJ", title: "Partidos Jugados", sortable: true },
  { key: "wins", label: "PG", title: "Partidos Ganados", sortable: true },
  { key: "losses", label: "PP", title: "Partidos Perdidos", sortable: true },
  { key: "draws", label: "PE", title: "Partidos Empatados", sortable: true },
  { key: "goals", label: "Goles", title: "Goles", sortable: true },
  { key: "assists", label: "Asist.", title: "Asistencias", sortable: true },
  { key: "goalRate", label: "GR", title: "Ritmo Goleador", sortable: true },
  {
    key: "winRate",
    label: "Win%",
    title: "Porcentaje de Victorias",
    sortable: true,
  },
  {
    key: "participationRate",
    label: "Part.%",
    title: "Porcentaje de Participación",
    sortable: true,
  },
];

// Single-player mode reuses the same DTO fields — year/tournament/rival
// breakdown is not yet available in PlayerStatRowDTO.
const singleColumns: ColumnDef[] = [
  { key: "games", label: "PJ", title: "Partidos Jugados", sortable: true },
  { key: "wins", label: "PG", title: "Partidos Ganados", sortable: true },
  { key: "losses", label: "PP", title: "Partidos Perdidos", sortable: true },
  { key: "draws", label: "PE", title: "Partidos Empatados", sortable: true },
  { key: "goals", label: "Goles", title: "Goles", sortable: true },
  { key: "assists", label: "Asist.", title: "Asistencias", sortable: true },
  { key: "goalRate", label: "GR", title: "Ritmo Goleador", sortable: true },
  {
    key: "winRate",
    label: "Win%",
    title: "Porcentaje de Victorias",
    sortable: true,
  },
  {
    key: "participationRate",
    label: "Part.%",
    title: "Porcentaje de Participación",
    sortable: true,
  },
];

const columns = computed(() =>
  props.mode === "all" ? allColumns : singleColumns,
);

const tableRows = computed(() =>
  props.rows.map((row) => ({
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
  <StatsTable :columns="columns" :rows="tableRows" :loading="loading">
    <template #name-data="{ row }">
      <div class="flex gap-x-2 items-baseline">
        <span class="font-medium">{{ row.name }}</span>
        <span v-if="row.nickname" class="text-sm text-gray-400">{{
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
      {{ row.winRate != null ? (Number(row.winRate) * 100).toFixed(1) : "—" }}%
    </template>
    <template #participationRate-data="{ row }">
      {{
        row.participationRate != null
          ? (Number(row.participationRate) * 100).toFixed(1)
          : "—"
      }}%
    </template>
  </StatsTable>
</template>
