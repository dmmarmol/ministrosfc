<script setup lang="ts">
import type { TeamSummaryHeaderDTO } from "@ministrosfc/shared";
import StatsHeader from "../../components/pages/stats/StatsHeader.vue";

definePageMeta({ layout: "statistics", public: true });
useHead({ title: "Estadísticas – Ministros FC" });

const authStore = useAuthStore();
const { $api } = useNuxtApp();

const { data: summaryData } = await useAsyncData(
  "team-summary",
  () =>
    authStore.isAuthenticated
      ? $api<{ data: TeamSummaryHeaderDTO }>("/api/v1/statistics/team/summary")
      : Promise.resolve(null),
  { server: false },
);
const summary = computed(() => summaryData.value?.data ?? null);
</script>

<template>
  <div>
    <h1 class="text-xl font-bold text-gray-900 mb-4">Estadísticas Generales</h1>
    <StatsHeader v-if="authStore.isAuthenticated" :summary="summary" />
    <div v-else class="text-center py-16 text-gray-500">
      <p class="mb-2">Iniciá sesión para ver las estadísticas del equipo.</p>
      <NuxtLink to="/login" class="text-brand hover:underline font-medium"
        >Iniciar sesión</NuxtLink
      >
    </div>
  </div>
</template>
