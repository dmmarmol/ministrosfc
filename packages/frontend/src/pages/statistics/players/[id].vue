<script setup lang="ts">
import type { PlayerStatRowDTO } from "@ministrosfc/shared";
import StatsTableByPlayer from "../../../components/pages/statistics/StatsTableByPlayer.vue";
import StatsTitle from "~/components/pages/statistics/StatsTitle.vue";
import YearSelect from "~/components/pages/statistics/StatsFilters/YearSelect.vue";

definePageMeta({
  layout: "statistics",
  middleware: "auth",
  requiresAuth: true,
});

const route = useRoute();
const playerId = route.params.id as string;
useHead({ title: "Estadísticas – Ministros FC" });

const { $api } = useNuxtApp();
const { year: yearFilter, filters } = useStatsFilters();

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
  () => route.query,
  () => refresh(),
);
</script>

<template>
  <div class="space-y-6">
    <StatsTitle>Estadísticas del Jugador</StatsTitle>
    <div class="flex flex-wrap gap-3">
      <YearSelect v-model="yearFilter" />
    </div>
    <StatsTableByPlayer :rows="rows" mode="single" :loading="pending" />
  </div>
</template>
