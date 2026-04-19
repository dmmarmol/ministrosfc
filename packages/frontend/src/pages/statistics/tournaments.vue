<script setup lang="ts">
import type { TeamStatPeriodDTO } from "@ministrosfc/shared";
import StatsTableByTournament from "../../components/pages/stats/StatsTableByTournament.vue";

definePageMeta({
  layout: "statistics-private",
  filtersMode: "tournaments",
  middleware: "auth",
  requiresAuth: true,
});
useHead({ title: "Estadísticas por Torneo – Ministros FC" });

const { $api } = useNuxtApp();
const route = useRoute();
const qp = useQueryParams();

const { data, pending, refresh } = await useAsyncData(
  "team-by-tournament",
  () =>
    $api<{ data: TeamStatPeriodDTO[] }>(
      "/api/v1/statistics/team/by-tournament",
      {
        query: {
          ...(qp.get("year") ? { year: qp.get("year") } : {}),
          ...(qp.get("rivalId") ? { rivalId: qp.get("rivalId") } : {}),
          ...(qp.get("tournament")
            ? { tournamentName: qp.get("tournament") }
            : {}),
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
  <div>
    <UiStatsTitle>Estadísticas por Torneo</UiStatsTitle>
    <StatsTableByTournament :rows="rows" :loading="pending" />
  </div>
</template>
