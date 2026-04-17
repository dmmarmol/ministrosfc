<script setup lang="ts">
import type { PlayerStatRowDTO } from "@ministrosfc/shared";
import StatsFilters from "../../../components/pages/stats/StatsFilters.vue";
import StatsTableByPlayer from "../../../components/pages/stats/StatsTableByPlayer.vue";

definePageMeta({
  layout: "statistics",
  middleware: "auth",
  requiresAuth: true,
});

const route = useRoute();
const playerId = route.params.id as string;
useHead({ title: "Estadísticas – Ministros FC" });

const { $api } = useNuxtApp();
const { filters, setFilter } = useStatsFilters();

const { data, pending, refresh } = await useAsyncData(
  `player-stats-${playerId}`,
  () =>
    $api<{ data: PlayerStatRowDTO[] }>(
      `/api/v1/statistics/players/${playerId}`,
      {
        query: {
          ...(filters.value.year ? { year: filters.value.year } : {}),
          ...(filters.value.rivalId ? { rivalId: filters.value.rivalId } : {}),
        },
      },
    ),
  { server: false },
);

const rows = computed(() => data.value?.data ?? []);
watch(
  () => [filters.value.year, filters.value.rivalId],
  () => refresh(),
);
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-xl font-bold text-gray-900">Estadísticas del Jugador</h1>
    <StatsFilters
      mode="player"
      :year="filters.year"
      @change:year="(v) => setFilter('year', v)"
    />
    <StatsTableByPlayer :rows="rows" mode="single" :loading="pending" />
  </div>
</template>
