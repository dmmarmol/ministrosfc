<script setup lang="ts">
import type {
  TeamSummaryHeaderDTO,
  PlayerStatRowDTO,
} from "@ministrosfc/shared/types/statistics";
import StatsHeader from "../../../components/pages/stats/StatsHeader.vue";
import StatsFilters from "../../../components/pages/stats/StatsFilters.vue";
import StatsTableByPlayer from "../../../components/pages/stats/StatsTableByPlayer.vue";

definePageMeta({ middleware: "auth", requiresAuth: true });
useHead({ title: "Estadísticas de Jugadores – Ministros FC" });

const { $api } = useNuxtApp();
const { filters, setFilter } = useStatsFilters();

const { data: summaryData } = await useAsyncData("team-summary", () =>
  $api<{ data: TeamSummaryHeaderDTO }>("/api/v1/statistics/team/summary"),
);
const summary = computed(() => summaryData.value?.data ?? null);

const { data, pending, refresh } = await useAsyncData("all-player-stats", () =>
  $api<{ data: PlayerStatRowDTO[] }>("/api/v1/statistics/players", {
    query: {
      ...(filters.value.year ? { year: filters.value.year } : {}),
      ...(filters.value.rivalId ? { rivalId: filters.value.rivalId } : {}),
    },
  }),
);
watch(
  () => [filters.value.year, filters.value.rivalId],
  () => refresh(),
);

const rows = computed(() => data.value?.data ?? []);
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-xl font-bold text-gray-900">Estadísticas de Jugadores</h1>
    <StatsHeader :summary="summary" />
    <StatsFilters
      mode="players"
      :year="filters.year"
      @change:year="(v) => setFilter('year', v)"
    />
    <StatsTableByPlayer :rows="rows" mode="all" :loading="pending" />
  </div>
</template>
