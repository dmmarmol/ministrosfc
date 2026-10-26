<script setup lang="ts">
import type { TeamStatPeriodDTO } from "@ministrosfc/shared";
import StatsTableByRival from "../../../components/pages/statistics/StatsTableByRival.vue";
import YearSelect from "~/components/pages/statistics/StatsFilters/YearSelect.vue";
import TournamentSelect from "~/components/pages/statistics/StatsFilters/TournamentSelect.vue";
import RivalSelect from "~/components/pages/statistics/StatsFilters/RivalSelect.vue";
import StatsTitle from "~/components/pages/statistics/StatsTitle.vue";
import PlaygroundSelect from "~/components/pages/admin/playground/PlaygroundSelect.vue";

definePageMeta({
  layout: "statistics-private",
  middleware: "auth",
  requiresAuth: true,
});
useHead({ title: "Estadísticas por Rival – Ministros FC" });

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
    <div class="flex gap-3 mb-6">
      <YearSelect v-model="yearFilter" class="w-full" />
      <PlaygroundSelect v-model="playgroundFilter" class="w-full" />
      <TournamentSelect v-model="tournamentFilter" class="w-full" />
      <RivalSelect v-model="rivalFilter" class="w-full" />
    </div>
    <StatsTitle>Estadísticas por Rival</StatsTitle>
    <StatsTableByRival :rows="rows" :loading="pending" />
  </div>
</template>
