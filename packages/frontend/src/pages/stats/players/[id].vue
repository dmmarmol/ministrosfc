<script setup lang="ts">
import type {
  TeamSummaryHeaderDTO,
  PlayerStatRowDTO,
} from "@ministrosfc/shared/types/statistics";
import StatsHeader from "../../../components/pages/stats/StatsHeader.vue";
import StatsFilters from "../../../components/pages/stats/StatsFilters.vue";
import StatsTableByPlayer from "../../../components/pages/stats/StatsTableByPlayer.vue";

definePageMeta({ middleware: "auth", requiresAuth: true });

const route = useRoute();
const playerId = route.params.id as string;
useHead({ title: "Estadísticas – Ministros FC" });

const { $api } = useNuxtApp();
const { filters, setFilter } = useStatsFilters();

const { data: summaryData } = await useAsyncData("team-summary", () =>
  $api<{ data: TeamSummaryHeaderDTO }>("/api/v1/statistics/team/summary"),
);
const summary = computed(() => summaryData.value?.data ?? null);

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
);
watch(
  () => [filters.value.year, filters.value.rivalId],
  () => refresh(),
);

const rows = computed(() => data.value?.data ?? []);
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-xl font-bold text-gray-900">Estadísticas del Jugador</h1>
    <StatsHeader :summary="summary" />
    <StatsFilters
      mode="player"
      :year="filters.year"
      @change:year="(v) => setFilter('year', v)"
    />
    <StatsTableByPlayer :rows="rows" mode="single" :loading="pending" />
  </div>
</template>
