<script setup lang="ts">
import type { PlayerStatRowDTO } from "@ministrosfc/shared";
import StatsTableByPlayer from "../../../components/pages/stats/StatsTableByPlayer.vue";

definePageMeta({
  layout: "statistics-private",
  filtersMode: "players",
  middleware: "auth",
  requiresAuth: true,
});
useHead({ title: "Estadísticas de Jugadores – Ministros FC" });

const { $api } = useNuxtApp();
const route = useRoute();
const qp = useQueryParams();

const { data, pending, refresh } = await useAsyncData(
  "all-player-stats",
  () =>
    $api<{ data: PlayerStatRowDTO[] }>("/api/v1/statistics/players", {
      query: {
        ...(qp.get("year") ? { year: qp.get("year") } : {}),
        ...(qp.get("rivalId") ? { rivalId: qp.get("rivalId") } : {}),
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
    <h1 class="text-xl font-bold text-gray-900">Estadísticas de Jugadores</h1>
    <StatsTableByPlayer :rows="rows" mode="all" :loading="pending" />
  </div>
</template>
