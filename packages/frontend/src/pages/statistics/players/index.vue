<script setup lang="ts">
import StatsField from "~/components/pages/statistics/StatsField.vue";
import StatsFilterBar from "~/components/pages/statistics/StatsFilterBar.vue";
import {
  OPTION_FILTER_ALL,
  type PlayerStatus,
  type AllPlayersStatsRow,
} from "@ministrosfc/shared";
import { useStatisticsAvailablePlayers } from "~/composables/useStatisticsAvailablePlayers";
import StatsTableByPlayer from "../../../components/pages/statistics/StatsTableByPlayer.vue";
import YearSelect from "~/components/pages/statistics/StatsFilters/YearSelect.vue";
import PlayerSelect from "~/components/pages/statistics/StatsFilters/PlayerSelect.vue";
import StatsTitle from "~/components/pages/statistics/StatsTitle.vue";
import { useStatsFilters } from "~/composables/useStatsFilters";
import { createTruthyObject } from "~/utils/object.js";


const { t } = useI18n();
definePageMeta({
  layout: "statistics-private",
  middleware: "auth",
  requiresAuth: true,
});
useHead({ title: t("statisticsPlayers.estadisticasDeJugadores") });

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
    <StatsTitle>{{ t("common.jugadores") }}</StatsTitle>
    <StatsFilterBar>
      <StatsField :label="t('common.ano')"><YearSelect v-model="yearFilter" /></StatsField>
      <StatsField :label="t('common.estado')"><UiPlayerStatusSelect
        include-all
        v-model="playerStatusFilter"
       
      /></StatsField>
      <StatsField :label="t('common.jugador')"><PlayerSelect
        :items="availablePlayers"
        v-model="playerFilter"
        :status="selectedPlayerStatus"
       
      /></StatsField>
    </StatsFilterBar>
    <StatsTableByPlayer :rows="rows" :loading="pending" />
  </div>
</template>
