<script setup lang="ts">
definePageMeta({ public: true });
import { useGetPlayerById } from "~/composables/useGetPlayerById";
import { useGetPlayerStatsById } from "~/composables/useGetPlayerStatsById";
import PlayerHeader from "~/components/pages/player/PlayerHeader.vue";
import PlayerCareerStats from "~/components/pages/player/PlayerCareerStats.vue";
import PlayerStatsByRival from "~/components/pages/player/PlayerStatsByRival.vue";
import { useAuthStore } from "~/stores/auth";

const route = useRoute();
const qp = useQueryParams();
const id = route.params.id as string;

const year = computed(() => qp.get("year") || undefined);

const { player, pending } = await useGetPlayerById(id);
const { stats, availableYears } = await useGetPlayerStatsById(id, { year });
const authStore = useAuthStore();

if (!authStore.isAuthenticated && player.value?.status === "INACTIVE") {
  await navigateTo("/roster");
}

async function onYearChange(newYear: string) {
  await qp.set("year", newYear);
}

useHead(() => ({
  title: player.value
    ? `${player.value.firstName} ${player.value.lastName} – Ministros FC`
    : "Jugador no encontrado – Ministros FC",
}));
</script>

<template>
  <div>
    <div v-if="pending" class="space-y-4">
      <div class="h-64 bg-gray-200 animate-pulse rounded-2xl" />
    </div>
    <template v-else-if="player">
      <PlayerHeader :player="player" />
      <PlayerCareerStats
        :stats="stats"
        :available-years="availableYears"
        :year="year"
        @year-change="onYearChange"
      />
      <div v-if="authStore.isAuthenticated" class="mt-8">
        <h2 class="text-lg font-bold text-gray-800 mb-4">
          Estadísticas por equipo rival
        </h2>
        <PlayerStatsByRival :player-id="id" />
      </div>
    </template>
    <div v-else class="text-center py-16 text-gray-500">
      Jugador no encontrado.
    </div>
  </div>
</template>
