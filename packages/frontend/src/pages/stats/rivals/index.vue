<script setup lang="ts">
import type {
  TeamSummaryHeaderDTO,
  TeamStatPeriodDTO,
} from "@ministrosfc/shared/types/statistics";
import StatsHeader from "../../../components/pages/stats/StatsHeader.vue";
import StatsFilters from "../../../components/pages/stats/StatsFilters.vue";
import StatsTableByRival from "../../../components/pages/stats/StatsTableByRival.vue";

definePageMeta({ middleware: "auth", requiresAuth: true });
useHead({ title: "Estadísticas por Rival – Ministros FC" });

const { $api } = useNuxtApp();
const { filters, setFilter } = useStatsFilters();

const { data: summaryData } = await useAsyncData("team-summary", () =>
  $api<{ data: TeamSummaryHeaderDTO }>("/api/v1/statistics/team/summary"),
);
const summary = computed(() => summaryData.value?.data ?? null);

const { data, pending, refresh } = await useAsyncData("team-by-rival", () =>
  $api<{ data: TeamStatPeriodDTO[] }>("/api/v1/statistics/team/by-rival", {
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
    <h1 class="text-xl font-bold text-gray-900">Estadísticas por Rival</h1>
    <StatsHeader :summary="summary" />
    <StatsFilters
      mode="rivals"
      :year="filters.year"
      @change:year="(v) => setFilter('year', v)"
    />
    <StatsTableByRival :rows="rows" mode="all" :loading="pending" />
  </div>
</template>
