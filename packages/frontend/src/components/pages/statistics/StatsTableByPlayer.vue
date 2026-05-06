<script setup lang="ts">
import { computed, ref } from "vue";
import type { PlayerStatRowDTO } from "@ministrosfc/shared";
import type { ColumnDef } from "~/types/table";
import {
  cellWins,
  cellLosses,
  cellDraws,
  cellPercent,
  cellRate,
  cellPlayerLink,
} from "~/components/ui/Table/table-utils";

type PlayerRow = {
  playerId: string;
  name: string;
  nickname: string | null;
  games: number;
  wins: number;
  losses: number;
  draws: number;
  goals: number;
  assists: number;
  goalRate: number;
  winRate: number;
  participationRate: number;
};

const props = defineProps<{
  rows: PlayerStatRowDTO[];
  mode: "all" | "single";
  loading: boolean;
}>();

const sharedCols: ColumnDef<PlayerRow>[] = [
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
    cell: ({ row }) => cellWins(row.getValue("wins")),
  },
  {
    accessorKey: "losses",
    header: "PP",
    title: "Partidos Perdidos",
    sortable: true,
    cell: ({ row }) => cellLosses(row.getValue("losses")),
  },
  {
    accessorKey: "draws",
    header: "PE",
    title: "Partidos Empatados",
    sortable: true,
    cell: ({ row }) => cellDraws(row.getValue("draws")),
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
    header: "Prom.",
    title: "Promedio de gol",
    sortable: true,
    cell: ({ row }) => cellRate(row.getValue("goalRate")),
  },
  {
    accessorKey: "winRate",
    header: "Win%",
    title: "Porcentaje de Victorias",
    sortable: true,
    cell: ({ row }) => cellPercent(row.getValue("winRate")),
  },
  {
    accessorKey: "participationRate",
    header: "Part.%",
    title: "Porcentaje de Participación",
    sortable: true,
    cell: ({ row }) => cellPercent(row.getValue("participationRate")),
  },
];

const allColumns: ColumnDef<PlayerRow>[] = [
  {
    accessorKey: "name",
    header: "Jugador",
    title: "Jugador",
    sortable: true,
    cell: ({ row }) =>
      cellPlayerLink(row.original as Record<string, unknown>, {
        nicknameKey: "nickname",
      }),
  },
  ...sharedCols,
];

// Single-player mode reuses the same DTO fields — year/tournament/rival
// breakdown is not yet available in PlayerStatRowDTO.
const singleColumns: ColumnDef<PlayerRow>[] = sharedCols;

const columns = computed(() =>
  props.mode === "all" ? allColumns : singleColumns,
);

const tableRows = computed((): PlayerRow[] =>
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

const sorting = ref([{ id: "games", desc: true }]);
</script>

<template>
  <UTable
    v-model:sorting="sorting"
    :data="tableRows"
    :columns="columns"
    :loading="loading"
  />
</template>
