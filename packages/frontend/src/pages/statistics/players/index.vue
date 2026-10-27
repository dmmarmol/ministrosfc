<script setup lang="ts">
import { OPTION_FILTER_ALL, type PlayerStatus } from "@ministrosfc/shared";
import { useStatisticsAvailablePlayers } from "~/composables/useStatisticsAvailablePlayers";
import StatsTableByPlayer from "../../../components/pages/statistics/StatsTableByPlayer.vue";
import YearSelect from "~/components/pages/statistics/StatsFilters/YearSelect.vue";
import PlayerSelect from "~/components/pages/statistics/StatsFilters/PlayerSelect.vue";
import StatsTitle from "~/components/pages/statistics/StatsTitle.vue";
import type { AllPlayersStatsRow } from "@ministrosfc/cms/src/types/statistics/internal";
import { useStatsFilters } from "~/composables/useStatsFilters";
import { createTruthyObject } from "~/utils/object.js";

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

const { availablePlayers } = useStatisticsAvailablePlayers();

const selectedPlayerStatus = computed<PlayerStatus | null>(() => {
  const value = playerStatusFilter.value;
  if (!value || value === OPTION_FILTER_ALL) return null;
  return value as PlayerStatus;
});

const { data, pending, refresh } = await useAsyncData(
  "all-player-stats",
  () =>
    $api<{ data: AllPlayersStatsRow[] }>("/api/v1/statistics/players", {
      query: createTruthyObject({
        status: filters.value?.playerStatus,
        year: filters.value?.year,
        rivalId: filters.value?.rivalId,
        tournamentName: filters.value?.tournament,
        playerId: filters.value?.playerId,
      }),
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
    <div class="flex gap-3 mb-6">
      <YearSelect v-model="yearFilter" class="w-full" />
      <UiPlayerStatusSelect
        include-all
        v-model="playerStatusFilter"
        class="w-full"
      />
      <PlayerSelect
        :items="availablePlayers"
        v-model="playerFilter"
        :status="selectedPlayerStatus"
        class="w-full"
      />
    </div>
    <StatsTitle>Estadísticas de Jugadores</StatsTitle>
    <StatsTableByPlayer :rows="rows" :loading="pending" />
  </div>
</template>
