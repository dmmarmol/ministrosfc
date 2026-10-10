<script setup lang="ts">
import { computed, ref } from "vue";
import type { AllPlayersStatsRow } from "@ministrosfc/cms/src/types/statistics/internal";
import type { ColumnDef } from "~/types/table";
import {
  cellWins,
  cellLosses,
  cellDraws,
  cellPercent,
  cellRate,
  cellPlayerLink,
  getSortedIcon,
} from "~/components/ui/Table/table-utils";
import { UButton } from "#components";

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
    header: ({ column }) => {
      return h(UButton, {
        variant: "ghost",
        color: "neutral",
        label: "Pos",
        icon: getSortedIcon(column.getIsSorted() || null),
        onClick: () => column.toggleSorting(),
      });
    },
    cell: ({ row }) =>
      h(resolveComponent("UiPositionLabel"), {
        position: row.getValue("position"),
      }),
  },
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
  {
    accessorKey: "games",
    title: "Partidos Jugados",
    sortable: true,
    header: ({ column }) => {
      return h(UButton, {
        variant: "ghost",
        color: "neutral",
        label: "PJ",
        icon: getSortedIcon(column.getIsSorted() || null),
        onClick: () => column.toggleSorting(),
      });
    },
  },
  {
    accessorKey: "wins",
    title: "Partidos Ganados",
    sortable: true,
    header: ({ column }) => {
      return h(UButton, {
        variant: "ghost",
        color: "neutral",
        label: "PG",
        icon: getSortedIcon(column.getIsSorted() || null),
        onClick: () => column.toggleSorting(),
      });
    },
    cell: ({ row }) => cellWins(row.getValue("wins")),
  },
  {
    accessorKey: "losses",
    title: "Partidos Perdidos",
    sortable: true,
    header: ({ column }) => {
      return h(UButton, {
        variant: "ghost",
        color: "neutral",
        label: "PP",
        icon: getSortedIcon(column.getIsSorted() || null),
        onClick: () => column.toggleSorting(),
      });
    },
    cell: ({ row }) => cellLosses(row.getValue("losses")),
  },
  {
    accessorKey: "draws",
    title: "Partidos Empatados",
    sortable: true,
    header: ({ column }) => {
      return h(UButton, {
        variant: "ghost",
        color: "neutral",
        label: "PE",
        icon: getSortedIcon(column.getIsSorted() || null),
        onClick: () => column.toggleSorting(),
      });
    },
    cell: ({ row }) => cellDraws(row.getValue("draws")),
  },
  {
    accessorKey: "goals",
    title: "Goles",
    sortable: true,
    header: ({ column }) => {
      return h(UButton, {
        variant: "ghost",
        color: "neutral",
        label: "Goles",
        icon: getSortedIcon(column.getIsSorted() || null),
        onClick: () => column.toggleSorting(),
      });
    },
  },
  {
    accessorKey: "assists",
    title: "Asistencias",
    sortable: true,
    header: ({ column }) => {
      return h(UButton, {
        variant: "ghost",
        color: "neutral",
        label: "Asist.",
        icon: getSortedIcon(column.getIsSorted() || null),
        onClick: () => column.toggleSorting(),
      });
    },
  },
  {
    accessorKey: "goalRate",
    title: "Promedio de gol",
    sortable: true,
    header: ({ column }) => {
      return h(UButton, {
        variant: "ghost",
        color: "neutral",
        label: "Prom.",
        icon: getSortedIcon(column.getIsSorted() || null),
        onClick: () => column.toggleSorting(),
      });
    },
    cell: ({ row }) => cellRate(row.getValue("goalRate")),
  },
  {
    accessorKey: "winRate",

    title: "Porcentaje de Victorias",
    sortable: true,
    header: ({ column }) => {
      return h(UButton, {
        variant: "ghost",
        color: "neutral",
        label: "Win%",
        icon: getSortedIcon(column.getIsSorted() || null),
        onClick: () => column.toggleSorting(),
      });
    },
    cell: ({ row }) => cellPercent(row.getValue("winRate")),
  },
  {
    accessorKey: "participationRate",
    title: "Porcentaje de Participación",
    sortable: true,
    header: ({ column }) => {
      return h(UButton, {
        variant: "ghost",
        color: "neutral",
        label: "Part.%",
        icon: getSortedIcon(column.getIsSorted() || null),
        onClick: () => column.toggleSorting(),
      });
    },
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
