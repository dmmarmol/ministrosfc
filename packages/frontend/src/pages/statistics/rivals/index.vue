<script setup lang="ts">
import type { TeamStatPeriodDTO } from "@ministrosfc/shared";
import StatsTableByRival from "../../../components/pages/stats/StatsTableByRival.vue";
import YearFilter from "~/components/pages/statistics/StatsFilters/YearFilter.vue";
import TournamentFilter from "~/components/pages/statistics/StatsFilters/TournamentFilter.vue";
import RivalFilter from "~/components/pages/statistics/StatsFilters/RivalFilter.vue";

definePageMeta({
  layout: "statistics-private",
  middleware: "auth",
  requiresAuth: true,
});
useHead({ title: "Estadísticas por Rival – Ministros FC" });

const { $api } = useNuxtApp();
const route = useRoute();
const {
  year: yearFilter,
  tournament: tournamentFilter,
  rivalId: rivalFilter,
  filters,
} = useStatsFilters();

const { data, pending, refresh } = await useAsyncData(
  "team-by-rival",
  () =>
    $api<{ data: TeamStatPeriodDTO[] }>("/api/v1/statistics/team/by-rival", {
      query: {
        ...(filters.value.year ? { year: filters.value.year } : {}),
        ...(filters.value.tournament
          ? { tournamentName: filters.value.tournament }
          : {}),
        ...(filters.value.rivalId ? { rivalId: filters.value.rivalId } : {}),
      },
    }),
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
      <RivalFilter v-model="rivalFilter" />
    </div>
    <StatsTitle>Estadísticas por Rival</StatsTitle>
    <StatsTableByRival :rows="rows" mode="all" :loading="pending" />
  </div>
</template>
