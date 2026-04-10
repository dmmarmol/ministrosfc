<script setup lang="ts">
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
        query: { status: "SCHEDULED", limit: 1 },
      }),
    ),
    useAsyncData("dash-recent", () =>
      $api<{ data: any[] }>("/api/v1/games", {
        query: { status: "COMPLETED", limit: 5 },
      }),
    ),
  ]);

const stats = computed(() => ({
  activePlayers: playersData.value?.pagination?.total ?? 0,
  upcomingGames: gamesData.value?.pagination?.total ?? 0,
  completedThisMonth: recentData.value?.data?.length ?? 0,
}));
const recentGames = computed(() => recentData.value?.data ?? []);

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("es-AR", {
    month: "short",
    day: "numeric",
  });
}
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
        <NuxtLink
          to="/admin/players/create"
          class="bg-brand text-gray-900 font-semibold text-sm px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
          >+ Agregar Jugador</NuxtLink
        >
        <NuxtLink
          to="/admin/games/create"
          class="bg-gray-900 text-white font-semibold text-sm px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >+ Programar Partido</NuxtLink
        >
        <NuxtLink
          to="/admin/tournaments"
          class="border border-gray-200 text-gray-700 font-semibold text-sm px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >Gestionar Torneos</NuxtLink
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
          <span class="text-gray-500 text-xs">{{ formatDate(g.date) }}</span>
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
