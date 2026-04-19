<script setup lang="ts">
import type { TeamStatPeriodDTO } from "@ministrosfc/shared";
import StatsTableByYear from "../../components/pages/stats/StatsTableByYear.vue";

definePageMeta({
  layout: "statistics-private",
  filtersMode: "years",
  middleware: "auth",
  requiresAuth: true,
});
useHead({ title: "Estadísticas por Año – Ministros FC" });

const { $api } = useNuxtApp();
const route = useRoute();
const qp = useQueryParams();

const { data, pending, refresh } = await useAsyncData(
  "team-by-year",
  () =>
    $api<{ data: TeamStatPeriodDTO[] }>("/api/v1/statistics/team/by-year", {
      query: {
        ...(qp.get("year") ? { year: qp.get("year") } : {}),
        ...(qp.get("tournament")
          ? { tournamentName: qp.get("tournament") }
          : {}),
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
    <UiStatsTitle>Estadísticas del Equipo</UiStatsTitle>
    <StatsTableByYear :rows="rows" :loading="pending" />
  </div>
</template>
