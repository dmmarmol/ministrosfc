<script setup lang="ts">
import type { PlayerStatRowDTO } from "@ministrosfc/shared";
import StatsTableByPlayer from "../../../components/pages/stats/StatsTableByPlayer.vue";
import YearFilter from "~/components/pages/statistics/StatsFilters/YearFilter.vue";
import PlayerStatusFilter from "~/components/pages/statistics/StatsFilters/PlayerStatusFilter.vue";
import PlayerFilter from "~/components/pages/statistics/StatsFilters/PlayerFilter.vue";

definePageMeta({
  layout: "statistics-private",
  middleware: "auth",
  requiresAuth: true,
});
useHead({ title: "Estadísticas de Jugadores – Ministros FC" });

const { $api } = useNuxtApp();
const route = useRoute();
const {
  year: yearFilter,
  playerId: playerFilter,
  playerStatus: playerStatusFilter,
  filters,
} = useStatsFilters();

const { data, pending, refresh } = await useAsyncData(
  "all-player-stats",
  () =>
    $api<{ data: PlayerStatRowDTO[] }>("/api/v1/statistics/players", {
      query: {
        status: filters.value.playerStatus,
        ...(filters.value.year ? { year: filters.value.year } : {}),
        ...(filters.value.rivalId ? { rivalId: filters.value.rivalId } : {}),
        ...(filters.value.tournament
          ? { tournamentName: filters.value.tournament }
          : {}),
        ...(filters.value.playerId ? { playerId: filters.value.playerId } : {}),
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
      <PlayerStatusFilter v-model="playerStatusFilter" />
      <PlayerFilter v-model="playerFilter" :status="playerStatusFilter" />
    </div>
    <StatsTitle>Estadísticas de Jugadores</StatsTitle>
    <StatsTableByPlayer :rows="rows" mode="all" :loading="pending" />
  </div>
</template>
