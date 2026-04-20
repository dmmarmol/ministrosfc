<script setup lang="ts">
import type { TeamStatPeriodDTO } from "@ministrosfc/shared";
import StatsTableByYear from "../../components/pages/stats/StatsTableByYear.vue";
import YearFilter from "~/components/pages/statistics/StatsFilters/YearFilter.vue";

definePageMeta({
  layout: "statistics-private",
  middleware: "auth",
  requiresAuth: true,
});
useHead({ title: "Estadísticas por Año – Ministros FC" });

const { $api } = useNuxtApp();
const route = useRoute();
const { year: yearFilter, filters } = useStatsFilters();

const { data, pending, refresh } = await useAsyncData(
  "team-by-year",
  () =>
    $api<{ data: TeamStatPeriodDTO[] }>("/api/v1/statistics/team/by-year", {
      query: {
        ...(filters.value.year ? { year: filters.value.year } : {}),
        ...(filters.value.tournament
          ? { tournamentName: filters.value.tournament }
          : {}),
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
    </div>
    <StatsTitle>Estadísticas del Equipo</StatsTitle>
    <StatsTableByYear :rows="rows" :loading="pending" />
  </div>
</template>
