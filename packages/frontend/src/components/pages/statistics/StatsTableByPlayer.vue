<script setup lang="ts">
import { computed, ref } from "vue";
import type { AllPlayersStatsRow } from "@ministrosfc/shared";
import type { ColumnDef } from "~/types/table";
import {
  cellWins,
  cellLosses,
  cellDraws,
  cellPercent,
  cellRate,
  cellPlayerLink,
  sortByPositionEnumOrder,
  sortableHeader,
  cellPosition,
  cellName,
} from "~/components/ui/Table/table-utils";
import type { Position } from "@ministrosfc/shared";

type PlayerRow = {
  playerId: string;
  name: string;
  nickname: string | null;
  position: string;
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
  rows: AllPlayersStatsRow[];
  loading: boolean;
}>();

const columns: ColumnDef<PlayerRow>[] = [
  {
    accessorKey: "position",
    meta: {
      class: {
        th: "w-16 text-center",
      },
    },
    sortable: true,
    sortingFn: sortByPositionEnumOrder,
    header: sortableHeader("Pos"),
    cell: ({ row }) => {
      const position: Position = row.getValue("position");
      return cellPosition(position);
    },
  },
  {
    accessorKey: "name",
    header: "Jugador",
    title: "Jugador",
    sortable: true,
    cell: ({ row }) =>
      cellPlayerLink(row.original, {
        nicknameKey: "nickname",
      }),
  },
  {
    accessorKey: "invitedBy",
    header: "Invitado",
    title: "Invitado Por",
    sortable: true,
    cell: ({ row }) => {
      const invitedBy: string = row.getValue("invitedBy");
      return invitedBy ? cellName(invitedBy) : null;
    },
  },
  {
    accessorKey: "games",
    title: "Partidos Jugados",
    sortable: true,
    meta: { class: { td: "text-center" } },
    header: sortableHeader("PJ"),
  },
  {
    accessorKey: "wins",
    title: "Partidos Ganados",
    sortable: true,
    meta: { class: { td: "text-center" } },
    header: sortableHeader("PG"),
    cell: ({ row }) => cellWins(row.getValue("wins")),
  },
  {
    accessorKey: "losses",
    title: "Partidos Perdidos",
    sortable: true,
    meta: { class: { td: "text-center" } },
    header: sortableHeader("PP"),
    cell: ({ row }) => cellLosses(row.getValue("losses")),
  },
  {
    accessorKey: "draws",
    title: "Partidos Empatados",
    sortable: true,
    meta: { class: { td: "text-center" } },
    header: sortableHeader("PE"),
    cell: ({ row }) => cellDraws(row.getValue("draws")),
  },
  {
    accessorKey: "goals",
    title: "Goles",
    sortable: true,
    meta: { class: { td: "text-center" } },
    header: sortableHeader("Goles"),
  },
  {
    accessorKey: "assists",
    title: "Asistencias",
    sortable: true,
    meta: { class: { td: "text-center" } },
    header: sortableHeader("Asist."),
  },
  {
    accessorKey: "goalRate",
    title: "Promedio de gol",
    sortable: true,
    meta: { class: { td: "text-center" } },
    header: sortableHeader("Prom."),
    cell: ({ row }) => cellRate(row.getValue("goalRate")),
  },
  {
    accessorKey: "winRate",

    title: "Porcentaje de Victorias",
    sortable: true,
    meta: { class: { td: "text-center" } },
    header: sortableHeader("Win%"),
    cell: ({ row }) => cellPercent(row.getValue("winRate")),
  },
  {
    accessorKey: "participationRate",
    title: "Porcentaje de Participación",
    sortable: true,
    meta: { class: { td: "text-center" } },
    header: sortableHeader("Part.%"),
    cell: ({ row }) => cellPercent(row.getValue("participationRate")),
  },
];

const tableRows = computed((): PlayerRow[] =>
  props.rows.map((row) => ({
    playerId: row.playerId,
    position: row.position,
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
