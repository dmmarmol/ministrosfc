<script setup lang="ts">
import StatsField from "~/components/pages/statistics/StatsField.vue";
import StatsFilterBar from "~/components/pages/statistics/StatsFilterBar.vue";
import type { TeamStatPeriodDTO } from "@ministrosfc/shared";
import StatsTableByTournament from "../../components/pages/statistics/StatsTableByTournament.vue";
import YearSelect from "~/components/pages/statistics/StatsFilters/YearSelect.vue";
import TournamentSelect from "~/components/pages/statistics/StatsFilters/TournamentSelect.vue";
import StatsTitle from "~/components/pages/statistics/StatsTitle.vue";
import PlaygroundSelect from "~/components/pages/admin/playground/PlaygroundSelect.vue";
import { useStatsFilters } from "~/composables/useStatsFilters";
import { createTruthyObject } from "~/utils/object.js";


const { t } = useI18n();
definePageMeta({
  layout: "statistics-private",
  middleware: "auth",
  requiresAuth: true,
});
useHead({ title: t("statisticsTournaments.estadisticasPorTorneo") });

const { $api } = useNuxtApp();
const route = useRoute();
const {
  year: yearFilter,
  tournament: tournamentFilter,
  playgroundId: playgroundFilter,
  filters,
} = useStatsFilters();

const { data, pending, refresh } = await useAsyncData(
  "team-by-tournament",
  () =>
    $api<{ data: TeamStatPeriodDTO[] }>(
      "/api/v1/statistics/team/by-tournament",
      {
        query: createTruthyObject({
          year: filters.value.year,
          rivalId: filters.value.rivalId,
          tournamentName: filters.value.tournament,
          playgroundId: filters.value.playgroundId,
        }),
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
  <div>
    <StatsTitle>{{ t("common.porTorneo") }}</StatsTitle>
    <StatsFilterBar>
      <StatsField :label="t('common.ano')"><YearSelect v-model="yearFilter" /></StatsField>
      <StatsField :label="t('common.torneo')"><TournamentSelect v-model="tournamentFilter" /></StatsField>
      <StatsField :label="t('common.cancha')"><PlaygroundSelect v-model="playgroundFilter" :placeholder="t('common.todas')" /></StatsField>
    </StatsFilterBar>
    <StatsTableByTournament :rows="rows" :loading="pending" />
  </div>
</template>
