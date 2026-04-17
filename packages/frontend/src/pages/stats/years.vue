<script setup lang="ts">
import type {
  TeamSummaryHeaderDTO,
  TeamStatPeriodDTO,
} from "@ministrosfc/shared/types/statistics";
import StatsHeader from "../../components/pages/stats/StatsHeader.vue";
import StatsFilters from "../../components/pages/stats/StatsFilters.vue";
import StatsTableByYear from "../../components/pages/stats/StatsTableByYear.vue";

definePageMeta({ middleware: "auth", requiresAuth: true });
useHead({ title: "Estadísticas por Año – Ministros FC" });

const { $api } = useNuxtApp();
const { filters, setFilter } = useStatsFilters();

const { data: summaryData } = await useAsyncData("team-summary", () =>
  $api<{ data: TeamSummaryHeaderDTO }>("/api/v1/statistics/team/summary"),
);
const summary = computed(() => summaryData.value?.data ?? null);

const { data, pending, refresh } = await useAsyncData("team-by-year", () =>
  $api<{ data: TeamStatPeriodDTO[] }>("/api/v1/statistics/team/by-year", {
    query: {
      ...(filters.value.year ? { year: filters.value.year } : {}),
      ...(filters.value.tournamentId
        ? { tournamentId: filters.value.tournamentId }
        : {}),
    },
  }),
);
watch(
  () => [filters.value.year, filters.value.tournamentId],
  () => refresh(),
);

const rows = computed(() => data.value?.data ?? []);
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-xl font-bold text-gray-900">Estadísticas del Equipo</h1>
    <StatsHeader :summary="summary" />
    <StatsFilters
      mode="years"
      :year="filters.year"
      @change:year="(v) => setFilter('year', v)"
    />
    <StatsTableByYear :rows="rows" :loading="pending" />
  </div>
</template>
