<script setup lang="ts">
import StatsField from "~/components/pages/statistics/StatsField.vue";
import StatsFilterBar from "~/components/pages/statistics/StatsFilterBar.vue";
import type { TeamStatPeriodDTO } from "@ministrosfc/shared";
import StatsTableByRival from "../../../components/pages/statistics/StatsTableByRival.vue";
import YearSelect from "~/components/pages/statistics/StatsFilters/YearSelect.vue";
import TournamentSelect from "~/components/pages/statistics/StatsFilters/TournamentSelect.vue";
import RivalSelect from "~/components/pages/statistics/StatsFilters/RivalSelect.vue";
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
useHead({ title: t("statisticsRivals.estadisticasPorRival") });

const { $api } = useNuxtApp();
const route = useRoute();
const {
  year: yearFilter,
  tournament: tournamentFilter,
  rivalId: rivalFilter,
  playgroundId: playgroundFilter,
  filters,
} = useStatsFilters();

type QueryFiltersByRival = {
  year?: string;
  tournamentName?: string;
  rivalId?: string;
  playgroundId?: string;
};

const { data, pending, refresh } = await useAsyncData(
  "team-by-rival",
  () =>
    $api<{ data: TeamStatPeriodDTO[] }>("/api/v1/statistics/team/by-rival", {
      query: createTruthyObject<QueryFiltersByRival>({
        year: filters.value.year,
        tournamentName: filters.value.tournament,
        rivalId: filters.value.rivalId,
        playgroundId: filters.value.playgroundId,
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
    <StatsTitle>{{ t("common.rivales") }}</StatsTitle>
    <StatsFilterBar>
      <StatsField :label="t('common.ano')"><YearSelect v-model="yearFilter" /></StatsField>
      <StatsField :label="t('common.cancha')"><PlaygroundSelect v-model="playgroundFilter" :placeholder="t('common.todas')" /></StatsField>
      <StatsField :label="t('common.torneo')"><TournamentSelect v-model="tournamentFilter" /></StatsField>
      <StatsField :label="t('statisticsRivals.rival')"><RivalSelect v-model="rivalFilter" /></StatsField>
    </StatsFilterBar>
    <StatsTableByRival :rows="rows" :loading="pending" />
  </div>
</template>
