<script setup lang="ts">
import type { TeamStatPeriodDTO } from "@ministrosfc/shared";
import StatsTableByRival from "../../../components/pages/stats/StatsTableByRival.vue";

definePageMeta({
  layout: "statistics-private",
  filtersMode: "rivals",
  middleware: "auth",
  requiresAuth: true,
});
useHead({ title: "Estadísticas por Rival – Ministros FC" });

const { $api } = useNuxtApp();
const route = useRoute();
const qp = useQueryParams();

const { data, pending, refresh } = await useAsyncData(
  "team-by-rival",
  () =>
    $api<{ data: TeamStatPeriodDTO[] }>("/api/v1/statistics/team/by-rival", {
      query: {
        ...(qp.get("year") ? { year: qp.get("year") } : {}),
        ...(qp.get("tournament")
          ? { tournamentName: qp.get("tournament") }
          : {}),
        ...(qp.get("rivalId") ? { rivalId: qp.get("rivalId") } : {}),
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
    <h1 class="text-xl font-bold text-gray-900">Estadísticas por Rival</h1>
    <StatsTableByRival :rows="rows" mode="all" :loading="pending" />
  </div>
</template>
