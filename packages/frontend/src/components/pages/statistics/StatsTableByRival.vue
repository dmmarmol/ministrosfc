<script setup lang="ts">
import { computed, ref } from "vue";
import { type TeamStatPeriodDTO } from "@ministrosfc/shared";
import type { ColumnDef } from "~/types/table";
import {
  cellWins,
  cellLosses,
  cellDraws,
  cellPercent,
  cellLink,
} from "~/components/ui/Table/table-utils";

type RivalRow = {
  rival: string;
  rivalId: string;
  games: number;
  wins: number;
  losses: number;
  draws: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  winRate: number;
  playgroundName: string;
};

const props = defineProps<{
  rows: TeamStatPeriodDTO[];
  loading: boolean;
}>();

const columns: ColumnDef<RivalRow>[] = [
  {
    accessorKey: "rival",
    header: "Rival",
    title: "Rival",
    sortable: true,
    cell: ({ row }) =>
      cellLink(
        row.getValue("rival"),
        `/statistics/rivals/${row.original.rivalId}`,
      ),
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
    cell: ({ row }) => cellPercent(row.getValue("winRate")),
  },
  {
    accessorKey: "playgroundName",
    header: "Cancha",
    title: "Cancha Más Frecuente",
    sortable: false,
  },
];

const tableRows = computed((): RivalRow[] =>
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
