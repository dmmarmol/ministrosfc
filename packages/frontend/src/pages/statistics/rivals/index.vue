<script setup lang="ts">
import type { TeamStatPeriodDTO } from "@ministrosfc/shared";
import StatsTableByRival from "../../../components/pages/statistics/StatsTableByRival.vue";
import YearSelect from "~/components/pages/statistics/StatsFilters/YearSelect.vue";
import TournamentSelect from "~/components/pages/statistics/StatsFilters/TournamentSelect.vue";
import RivalSelect from "~/components/pages/statistics/StatsFilters/RivalSelect.vue";
import StatsTitle from "~/components/pages/statistics/StatsTitle.vue";

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
  filters,
} = useStatsFilters();

const { data, pending, refresh } = await useAsyncData(
  "team-by-rival",
  () =>
    $api<{ data: TeamStatPeriodDTO[] }>("/api/v1/statistics/team/by-rival", {
      query: {
        ...(filters.value.year ? { year: filters.value.year } : {}),
        ...(filters.value.tournament
          ? { tournamentName: filters.value.tournament }
          : {}),
        ...(filters.value.rivalId ? { rivalId: filters.value.rivalId } : {}),
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
      <YearSelect v-model="yearFilter" />
      <TournamentFilter v-model="tournamentFilter" />
      <RivalFilter v-model="rivalFilter" />
    </div>
    <StatsTitle>Estadísticas por Rival</StatsTitle>
    <StatsTableByRival :rows="rows" :loading="pending" />
  </div>
</template>
