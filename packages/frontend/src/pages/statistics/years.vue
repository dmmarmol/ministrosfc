<script setup lang="ts">
import StatsField from "~/components/pages/statistics/StatsField.vue";
import StatsFilterBar from "~/components/pages/statistics/StatsFilterBar.vue";
import type { TeamStatPeriodDTO } from "@ministrosfc/shared";
import StatsTableByYear from "../../components/pages/statistics/StatsTableByYear.vue";
import YearSelect from "~/components/pages/statistics/StatsFilters/YearSelect.vue";
import StatsTitle from "~/components/pages/statistics/StatsTitle.vue";
import { useStatsFilters } from "~/composables/useStatsFilters";

definePageMeta({
  layout: "statistics-private",
  middleware: "auth",
  requiresAuth: true,
});
useHead({ title: "Estadísticas por Año" });

const { $api } = useNuxtApp();
const route = useRoute();
const { year: yearFilter, filters } = useStatsFilters();

const { data, pending, refresh } = await useAsyncData(
  "team-by-year",
  () =>
    $api<{ data: TeamStatPeriodDTO[] }>("/api/v1/statistics/team/by-year", {
      query: {
        ...(filters.value.year ? { year: filters.value.year } : {}),
        ...(filters.value.tournament
          ? { tournamentName: filters.value.tournament }
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
    <StatsTitle>Por año</StatsTitle>
    <StatsFilterBar>
      <StatsField label="Año"><YearSelect v-model="yearFilter" /></StatsField>
    </StatsFilterBar>
    <StatsTableByYear :rows="rows" :loading="pending" />
  </div>
</template>
