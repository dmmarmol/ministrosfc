<script setup lang="ts">
import type { TeamStatPeriodDTO } from "@ministrosfc/shared";
import StatsFilters from "../../../components/pages/stats/StatsFilters.vue";
import StatsTableByRival from "../../../components/pages/stats/StatsTableByRival.vue";

definePageMeta({
  layout: "statistics",
  middleware: "auth",
  requiresAuth: true,
});

const route = useRoute();
const rivalId = route.params.id as string;
useHead({ title: "Estadísticas – Ministros FC" });

const { $api } = useNuxtApp();
const { filters, setFilter } = useStatsFilters();

const { data, pending, refresh } = await useAsyncData(
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
);

const rows = computed(() => data.value?.data ?? []);
watch(
  () => filters.value.year,
  () => refresh(),
);
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-xl font-bold text-gray-900">Estadísticas vs Rival</h1>
    <StatsFilters
      mode="rival"
      :year="filters.year"
      @change:year="(v) => setFilter('year', v)"
    />
    <StatsTableByRival :rows="rows" mode="single" :loading="pending" />
  </div>
</template>
