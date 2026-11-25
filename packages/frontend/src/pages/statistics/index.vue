<script setup lang="ts">
import type { TeamSummaryHeaderDTO } from "@ministrosfc/shared";
import StatsHeader from "../../components/pages/statistics/StatsHeader.vue";
import StatsTitle from "~/components/pages/statistics/StatsTitle.vue";
import { useAuthStore } from "~/stores/auth";

definePageMeta({ layout: "statistics", public: true });
useHead({ title: "Estadísticas" });

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
    <StatsTitle>General</StatsTitle>
    <StatsHeader v-if="authStore.isAuthenticated" :summary="summary" />
    <div v-else class="mt-6">
      <p class="text-lg">Iniciá sesión para ver las estadísticas del equipo.</p>
      <NuxtLink to="/login" class="sheet-link mt-2 inline-flex min-h-11 items-center">Iniciar sesión →</NuxtLink>
    </div>
  </div>
</template>
