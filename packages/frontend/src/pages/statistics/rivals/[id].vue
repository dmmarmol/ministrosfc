<script setup lang="ts">
import type { TeamStatPeriodDTO } from "@ministrosfc/shared";
import StatsFilters from "../../../components/pages/stats/StatsFilters.vue";
import type { ColumnDef } from "~/types/table";

definePageMeta({
  layout: "statistics",
  public: true,
});

const route = useRoute();
const rivalId = route.params.id as string;
useHead({ title: "Estadísticas – Ministros FC" });

const { $api } = useNuxtApp();
const { filters, setFilter } = useStatsFilters();

const [{ data: teamData }, { data, pending, refresh }] = await Promise.all([
  useAsyncData(`rival-team-${rivalId}`, () =>
    $api<{ data: { name: string } }>(`/api/v1/teams/${rivalId}`),
  ),
  useAsyncData(
    `rival-stats-${rivalId}`,
    () =>
      $api<{ data: TeamStatPeriodDTO[] }>(
        `/api/v1/statistics/team/rivals/${rivalId}`,
        {
          query: {
            ...(filters.value.year ? { year: filters.value.year } : {}),
          },
        },
      ),
    { server: false },
  ),
]);

const rivalName = computed(() => teamData.value?.data?.name ?? rivalId);

const columns: ColumnDef[] = [
  { key: "year", label: "Año", title: "Año", sortable: true },
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
];

const tableRows = computed(() =>
  (data.value?.data ?? []).map((row) => ({
    year: row.label,
    games: row.gamesPlayed,
    wins: row.wins,
    losses: row.losses,
    draws: row.draws,
    goalsFor: row.goalsFor,
    goalsAgainst: row.goalsAgainst,
    goalDiff: row.goalsFor - row.goalsAgainst,
    winRate: row.winRate,
  })),
);

watch(
  () => filters.value.year,
  () => refresh(),
);
</script>

<template>
  <div class="space-y-6">
    <UiStatsTitle>Estadísticas vs {{ rivalName }}</UiStatsTitle>
    <StatsFilters
      mode="rival"
      :year="filters.year"
      @change:year="(v) => setFilter('year', v)"
    />

    <UiStatsTable :columns="columns" :rows="tableRows" :loading="pending">
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
  </div>
</template>
