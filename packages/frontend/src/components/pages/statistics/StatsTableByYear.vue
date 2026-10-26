<script setup lang="ts">
import { computed, ref } from "vue";
import { type TeamStatPeriodDTO } from "@ministrosfc/shared";
import { formatStatDate } from "~/utils/stats";
import type { ColumnDef } from "~/types/table";
import {
  cellWins,
  cellLosses,
  cellDraws,
  cellGoalDiff,
  cellPercent,
} from "~/components/ui/Table/table-utils";

type YearRow = {
  year: string;
  period: string;
  games: number;
  wins: number;
  losses: number;
  draws: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  winRate: number;
};

const props = defineProps<{
  rows: TeamStatPeriodDTO[];
  loading: boolean;
}>();

const columns: ColumnDef<YearRow>[] = [
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
    title: "Diferencia de Goles",
    sortable: true,
    cell: ({ row }) => cellGoalDiff(row.getValue("goalDiff")),
  },
  { accessorKey: "points", header: "PTS", title: "Puntos", sortable: true },
  {
    accessorKey: "winRate",
    header: "Win%",
    title: "Porcentaje de Victorias",
    sortable: true,
    cell: ({ row }) => cellPercent(row.getValue("winRate")),
  },
];

const tableRows = computed((): YearRow[] =>
  props.rows.map((row) => ({
    year: row.label,
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
    points: row.pointsEarned,
    winRate: row.winRate,
  })),
);

const sorting = ref([{ id: "year", desc: true }]);
</script>

<template>
  <UTable
    v-model:sorting="sorting"
    :data="tableRows"
    :columns="columns"
    :loading="loading"
  />
</template>
