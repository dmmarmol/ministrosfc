<script setup lang="ts">
import { GameStatus, formatDate } from "@ministrosfc/shared";

definePageMeta({
  layout: "admin",
  middleware: "auth",
  requiresAuth: true,
  requiresRole: "editor",
});
useHead({ title: "Dashboard – Admin" });

const { $api } = useNuxtApp();

const [{ data: playersData }, { data: gamesData }, { data: recentData }] =
  await Promise.all([
    useAsyncData("dash-players", () =>
      $api<{ pagination: any }>("/api/v1/players", {
        query: { status: "ACTIVE", limit: 1 },
      }),
    ),
    useAsyncData("dash-upcoming", () =>
      $api<{ data: any[] }>("/api/v1/games", {
        query: { status: GameStatus.SCHEDULED, limit: 1 },
      }),
    ),
    useAsyncData("dash-recent", () =>
      $api<{ data: any[] }>("/api/v1/games", {
        query: { status: GameStatus.COMPLETED, limit: 5 },
      }),
    ),
  ]);

const stats = computed(() => ({
  activePlayers: playersData.value?.pagination?.total ?? 0,
  upcomingGames: gamesData.value?.pagination?.total ?? 0,
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
          >+ Agregar Jugador</UButton
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
      <div v-if="recentGames.length" class="space-y-2">
        <div
          v-for="g in recentGames"
          :key="g.id"
          class="flex items-center justify-between text-sm py-2 border-b border-gray-50 last:border-0"
        >
          <span class="text-gray-800">vs {{ g.opponentTeam?.name }}</span>
          <span class="text-gray-500 text-xs">{{
            formatDate(g.date, { month: "short", day: "numeric" })
          }}</span>
          <NuxtLink
            :to="`/admin/games/${g.id}/edit`"
            class="text-xs text-brand hover:underline"
            >Editar</NuxtLink
          >
        </div>
      </div>
      <p v-else class="text-gray-500 text-sm">Sin partidos aún.</p>
    </div>
  </div>
</template>
