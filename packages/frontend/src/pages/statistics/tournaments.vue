<script setup lang="ts">
import type { TeamStatPeriodDTO } from "@ministrosfc/shared";
import StatsTableByTournament from "../../components/pages/statistics/StatsTableByTournament.vue";
import YearSelect from "~/components/pages/statistics/StatsFilters/YearSelect.vue";
import TournamentSelect from "~/components/pages/statistics/StatsFilters/TournamentSelect.vue";
import PlaygroundSelect from "~/components/pages/statistics/StatsFilters/PlaygroundSelect.vue";
import StatsTitle from "~/components/pages/statistics/StatsTitle.vue";

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
      <YearSelect v-model="yearFilter" />
      <TournamentSelect v-model="tournamentFilter" />
      <PlaygroundSelect v-model="playgroundFilter" />
    </div>
    <StatsTitle>Estadísticas por Torneo</StatsTitle>
    <StatsTableByTournament :rows="rows" :loading="pending" />
  </div>
</template>
