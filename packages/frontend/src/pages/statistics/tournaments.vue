<script setup lang="ts">
import type { TeamStatPeriodDTO } from "@ministrosfc/shared";
import StatsTableByTournament from "../../components/pages/statistics/StatsTableByTournament.vue";
import YearSelect from "~/components/pages/statistics/StatsFilters/YearSelect.vue";
import TournamentSelect from "~/components/pages/statistics/StatsFilters/TournamentSelect.vue";
import StatsTitle from "~/components/pages/statistics/StatsTitle.vue";
import PlaygroundSelect from "~/components/pages/admin/playground/PlaygroundSelect.vue";
import { useStatsFilters } from "~/composables/useStatsFilters";
import { createTruthyObject } from "~/utils/object.js";

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
        query: createTruthyObject({
          year: filters.value.year,
          rivalId: filters.value.rivalId,
          tournamentName: filters.value.tournament,
          playgroundId: filters.value.playgroundId,
        }),
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
    <div class="flex gap-3 mb-6">
      <YearSelect v-model="yearFilter" class="w-full" />
      <TournamentSelect v-model="tournamentFilter" class="w-full" />
      <PlaygroundSelect v-model="playgroundFilter" class="w-full" />
    </div>
    <StatsTitle>Estadísticas por Torneo</StatsTitle>
    <StatsTableByTournament :rows="rows" :loading="pending" />
  </div>
</template>
