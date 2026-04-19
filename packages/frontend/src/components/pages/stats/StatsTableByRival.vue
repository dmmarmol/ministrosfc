<script setup lang="ts">
import { computed } from "vue";
import { type TeamStatPeriodDTO } from "@ministrosfc/shared";
import { formatStatDate } from "~/utils/stats";
import type { ColumnDef } from "~/types/table";

const props = defineProps<{
  rows: TeamStatPeriodDTO[];
  mode: "all" | "single";
  loading: boolean;
}>();

const allColumns: ColumnDef[] = [
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

const singleColumns: ColumnDef[] = [
  { key: "year", label: "Año", title: "Año", sortable: true },
  { key: "tournament", label: "Torneo", title: "Torneo", sortable: true },
  { key: "period", label: "Período", title: "Período", sortable: false },
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
    key: "winRate",
    label: "Win%",
    title: "Porcentaje de Victorias",
    sortable: true,
  },
];

const columns = computed(() =>
  props.mode === "all" ? allColumns : singleColumns,
);

const tableRows = computed(() =>
  props.rows.map((row) => {
    if (props.mode === "all") {
      return {
        rival: row.label,
        games: row.gamesPlayed,
        wins: row.wins,
        losses: row.losses,
        draws: row.draws,
        goalsFor: row.goalsFor,
        goalsAgainst: row.goalsAgainst,
        winRate: row.winRate,
        playgroundName: row.playgroundName ?? "—",
      };
    }
    return {
      year: row.periodStart ? row.periodStart.slice(0, 4) : "—",
      tournament: row.label,
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
      winRate: row.winRate,
    };
  }),
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
    <template #winRate-data="{ row }">
      {{ Number(row.winRate).toFixed(1) }}%
    </template>
  </UiStatsTable>
</template>
