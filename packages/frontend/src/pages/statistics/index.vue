<script setup lang="ts">
import type { TeamSummaryHeaderDTO } from "@ministrosfc/shared";
import StatsHeader from "../../components/pages/statistics/StatsHeader.vue";
import StatsTitle from "~/components/pages/statistics/StatsTitle.vue";
import { useAuthStore } from "~/stores/auth";


const { t } = useI18n();
definePageMeta({ layout: "statistics", public: true });
useHead({ title: t("common.estadisticas") });

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
    <StatsTitle>{{ t("common.general") }}</StatsTitle>
    <StatsHeader v-if="authStore.isAuthenticated" :summary="summary" />
    <div v-else class="mt-6">
      <p class="text-lg">{{ t("statistics.iniciaSesionParaVer") }}</p>
      <NuxtLink to="/login" class="sheet-link mt-2 inline-flex min-h-11 items-center">{{ t("statistics.iniciarSesion") }}</NuxtLink>
    </div>
  </div>
</template>
