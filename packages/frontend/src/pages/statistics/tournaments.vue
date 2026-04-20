<script setup lang="ts">
import type { TeamStatPeriodDTO } from "@ministrosfc/shared";
import StatsTableByTournament from "../../components/pages/stats/StatsTableByTournament.vue";
import YearFilter from "~/components/pages/statistics/StatsFilters/YearFilter.vue";
import TournamentFilter from "~/components/pages/statistics/StatsFilters/TournamentFilter.vue";
import PlaygroundFilter from "~/components/pages/statistics/StatsFilters/PlaygroundFilter.vue";

definePageMeta({
  layout: "statistics-private",
  middleware: "auth",
  requiresAuth: true,
});
useHead({ title: "Estadísticas por Torneo – Ministros FC" });

const { $api } = useNuxtApp();
const route = useRoute();
const {
  year: yearFilter,
  tournament: tournamentFilter,
  playgroundId: playgroundFilter,
  filters,
} = useStatsFilters();

const { data, pending, refresh } = await useAsyncData(
  "team-by-tournament",
  () =>
    $api<{ data: TeamStatPeriodDTO[] }>(
      "/api/v1/statistics/team/by-tournament",
      {
        query: {
          ...(filters.value.year ? { year: filters.value.year } : {}),
          ...(filters.value.rivalId ? { rivalId: filters.value.rivalId } : {}),
          ...(filters.value.tournament
            ? { tournamentName: filters.value.tournament }
            : {}),
          ...(filters.value.playgroundId
            ? { playgroundId: filters.value.playgroundId }
            : {}),
        },
      },
    ),
  { server: false },
);

const rows = computed(() => data.value?.data ?? []);

watch(
  () => route.query,
  () => refresh(),
);
</script>

<template>
  <div>
    <div class="flex flex-wrap gap-3 mb-6">
      <YearFilter v-model="yearFilter" />
      <TournamentFilter v-model="tournamentFilter" />
      <PlaygroundFilter v-model="playgroundFilter" />
    </div>
    <StatsTitle>Estadísticas por Torneo</StatsTitle>
    <StatsTableByTournament :rows="rows" :loading="pending" />
  </div>
</template>
