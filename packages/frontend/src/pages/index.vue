<template>
  <div>
    <!-- Hero -->
    <section
      class="bg-gradient-to-br from-gray-900 to-gray-800 text-white py-16 px-4 rounded-2xl mb-10"
    >
      <div class="max-w-2xl">
        <h2 class="text-4xl font-bold mb-3">
          Bienvenido a <span class="text-brand">Ministros FC</span>
        </h2>
        <p class="text-gray-300 text-lg mb-6">
          Seguí al equipo — resultados, plantilla y próximos partidos.
        </p>
        <div class="flex gap-3 flex-wrap">
          <NuxtLink
            to="/roster"
            class="bg-brand text-gray-900 font-semibold px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
            >Ver Plantilla Completa</NuxtLink
          >
          <NuxtLink
            to="/schedule"
            class="border border-white/30 text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-white/10 transition-colors"
            >Ver Calendario</NuxtLink
          >
        </div>
      </div>
    </section>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Upcoming games -->
      <section class="lg:col-span-2">
        <h3 class="text-lg font-bold text-gray-800 mb-4">Próximos Partidos</h3>
        <div v-if="upcomingLoading" class="space-y-3">
          <div
            v-for="i in 3"
            :key="i"
            class="h-16 bg-gray-200 animate-pulse rounded-xl"
          />
        </div>
        <div v-else-if="upcomingGames.length" class="space-y-3">
          <GameCard v-for="game in upcomingGames" :key="game.id" :game="game" />
        </div>
        <p v-else class="text-gray-500 text-sm">
          Sin partidos próximos programados.
        </p>
        <NuxtLink
          to="/schedule"
          class="mt-4 inline-block text-sm text-brand font-medium hover:underline"
          >Ver calendario completo →</NuxtLink
        >
      </section>

      <!-- Top scorers widget -->
      <section>
        <h3 class="text-lg font-bold text-gray-800 mb-4">Máximos Goleadores</h3>
        <div v-if="scorersLoading" class="space-y-2">
          <div
            v-for="i in 5"
            :key="i"
            class="h-10 bg-gray-200 animate-pulse rounded"
          />
        </div>
        <div
          v-else-if="topScorers.length"
          class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
        >
          <div
            v-for="(entry, idx) in topScorers.slice(0, 5)"
            :key="entry.playerId"
            class="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0"
          >
            <span class="text-sm font-bold text-gray-400 w-5">{{
              idx + 1
            }}</span>
            <NuxtLink
              :to="`/players/${entry.playerId}`"
              class="flex-1 text-sm font-medium text-gray-800 hover:text-brand transition-colors truncate"
              >{{ entry.playerName }}</NuxtLink
            >
            <span class="text-sm font-bold text-brand"
              >{{ entry.goals }} ⚽</span
            >
          </div>
        </div>
        <p v-else class="text-gray-500 text-sm">Sin datos de goleadores.</p>
        <NuxtLink
          to="/statistics"
          class="mt-4 inline-block text-sm text-brand font-medium hover:underline"
          >Estadísticas completas →</NuxtLink
        >
      </section>
    </div>

    <!-- Recent results -->
    <section class="mt-10">
      <h3 class="text-lg font-bold text-gray-800 mb-4">Resultados Recientes</h3>
      <div v-if="recentLoading" class="space-y-3">
        <div
          v-for="i in 3"
          :key="i"
          class="h-16 bg-gray-200 animate-pulse rounded-xl"
        />
      </div>
      <div v-else-if="recentGames.length" class="space-y-3">
        <GameCard v-for="game in recentGames" :key="game.id" :game="game" />
      </div>
      <p v-else class="text-gray-500 text-sm">Sin partidos completados.</p>
    </section>
  </div>
</template>

<script setup lang="ts">
const { $api } = useNuxtApp();

// Upcoming games (next 3, scheduled)
const { data: upcomingData, pending: upcomingLoading } = await useAsyncData(
  "home-upcoming",
  () =>
    $api<{ data: any[] }>("/api/v1/games", {
      query: { status: "SCHEDULED", limit: 3 },
    }),
);
const upcomingGames = computed(() => upcomingData.value?.data ?? []);

// Recent results (last 3 completed)
const { data: recentData, pending: recentLoading } = await useAsyncData(
  "home-recent",
  () =>
    $api<{ data: any[] }>("/api/v1/games", {
      query: { status: "COMPLETED", limit: 3 },
    }),
);
const recentGames = computed(() => recentData.value?.data ?? []);

// Top scorers
const { data: scorersData, pending: scorersLoading } = await useAsyncData(
  "home-scorers",
  () =>
    $api<{ data: any[] }>("/api/v1/statistics/top-scorers", {
      query: { limit: 5 },
    }),
);
const topScorers = computed(() => scorersData.value?.data ?? []);
</script>
