<script setup lang="ts">
import { computed } from "vue";
import { useAsyncData, useHead } from "nuxt/app";
import { GameStatus, PlayerStatus } from "@ministrosfc/shared";
import RecentGamesTable from "~/components/pages/admin/dashboard/RecentGamesTable.vue";
import { useGames } from "~/composables/useGames";
import { usePlayers } from "~/composables/usePlayers";

definePageMeta({
  layout: "admin",
  middleware: "auth",
  requiresAuth: true,
  requiresRole: "editor",
  pageTitle: "Panel de administración",
});
useHead({ title: "Panel de administración" });

const gamesApi = useGames();
const playersApi = usePlayers();

const [{ data: playersData }, { data: gamesData }, { data: recentData }] =
  await Promise.all([
    useAsyncData("dash-players", () =>
      playersApi.fetchPlayers({ status: PlayerStatus.ACTIVE, limit: 1 }),
    ),
    useAsyncData("dash-upcoming", () =>
      gamesApi.fetchGames({ status: GameStatus.SCHEDULED, limit: 1 }),
    ),
    useAsyncData("dash-recent", () =>
      gamesApi.fetchGames({ status: GameStatus.COMPLETED, limit: 5 }),
    ),
  ]);

const stats = computed(() => ({
  activePlayers: playersData.value?.meta.total ?? 0,
  upcomingGames: gamesData.value?.meta.total ?? 0,
  completedThisMonth: recentData.value?.data?.length ?? 0,
}));
const recentGames = computed(() => recentData.value?.data ?? []);
</script>

<template>
  <div class="space-y-6">
    <!-- Quick stats -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <p class="text-xs text-gray-500 uppercase tracking-wide">
          Jugadores Activos
        </p>
        <p class="text-3xl font-bold text-gray-900 mt-1">
          {{ stats.activePlayers }}
        </p>
      </div>
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <p class="text-xs text-gray-500 uppercase tracking-wide">
          Próximos Partidos
        </p>
        <p class="text-3xl font-bold text-gray-900 mt-1">
          {{ stats.upcomingGames }}
        </p>
      </div>
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <p class="text-xs text-gray-500 uppercase tracking-wide">
          Completados Este Mes
        </p>
        <p class="text-3xl font-bold text-gray-900 mt-1">
          {{ stats.completedThisMonth }}
        </p>
      </div>
    </div>

    <!-- Shortcuts -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h2 class="text-sm font-semibold text-gray-700 mb-4">Acciones Rápidas</h2>
      <div class="flex flex-wrap gap-3">
        <UButton
          to="/admin/players/create"
          variant="solid"
          color="primary"
          icon="mdi:account-plus"
          >Agregar Jugador</UButton
        >
        <UButton
          to="/admin/games/create"
          variant="solid"
          color="secondary"
          icon="mdi:football-pitch"
          >Programar Partido</UButton
        >
        <UButton
          to="/admin/tournaments"
          variant="soft"
          color="neutral"
          icon="mdi:trophy"
          >Gestionar Torneos</UButton
        >
      </div>
    </div>

    <!-- Recent games -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h2 class="text-sm font-semibold text-gray-700 mb-4">
        Partidos Recientes
      </h2>
      <RecentGamesTable :games="recentGames" />
    </div>
  </div>
</template>
