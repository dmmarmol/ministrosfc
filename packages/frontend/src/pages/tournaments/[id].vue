<script setup lang="ts">
definePageMeta({ public: true });
const { $api } = useNuxtApp();
const route = useRoute();
const id = route.params.id as string;

const { data: tData, pending } = await useAsyncData(`tournament-${id}`, () =>
  $api<{ data: any }>(`/api/v1/tournaments/${id}`),
);
const tournament = computed(() => tData.value?.data ?? null);

const { data: statsData } = await useAsyncData(`tournament-stats-${id}`, () =>
  $api<{ data: any }>(`/api/v1/statistics/tournaments/${id}`),
);
const topScorers = computed(() => statsData.value?.data?.topScorers ?? []);
const games = computed(() => tournament.value?.games ?? []);

useHead(() => ({
  title: tournament.value
    ? `${tournament.value.name} – Ministros FC`
    : "Tournament",
}));

function formatFormat(fmt: string): string {
  return fmt?.replace(/_/g, " ").toLowerCase() ?? "";
}
</script>

<template>
  <div>
    <div v-if="pending" class="space-y-4">
      <div class="h-32 bg-gray-200 animate-pulse rounded-2xl" />
      <div
        v-for="i in 5"
        :key="i"
        class="h-10 bg-gray-200 animate-pulse rounded"
      />
    </div>
    <template v-else-if="tournament">
      <!-- Header -->
      <div class="bg-gray-900 text-white rounded-2xl p-6 mb-8">
        <p class="text-xs text-gray-400 uppercase tracking-wider mb-1">
          {{ formatFormat(tournament.format) }}
        </p>
        <h1 class="text-2xl font-bold mb-1">{{ tournament.name }}</h1>
        <p v-if="tournament.description" class="text-gray-300 text-sm mb-4">
          {{ tournament.description }}
        </p>
        <!-- Record summary -->
        <div
          v-if="tournament.ministrosRecord"
          class="flex gap-6 flex-wrap mt-4"
        >
          <div class="text-center">
            <p class="text-2xl font-bold text-green-400">
              {{ tournament.ministrosRecord.wins }}
            </p>
            <p class="text-xs text-gray-400">Wins</p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-bold text-yellow-400">
              {{ tournament.ministrosRecord.draws }}
            </p>
            <p class="text-xs text-gray-400">Draws</p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-bold text-red-400">
              {{ tournament.ministrosRecord.losses }}
            </p>
            <p class="text-xs text-gray-400">Losses</p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-bold">
              {{ tournament.ministrosRecord.goalsFor }}
            </p>
            <p class="text-xs text-gray-400">Scored</p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-bold">
              {{ tournament.ministrosRecord.goalsAgainst }}
            </p>
            <p class="text-xs text-gray-400">Conceded</p>
          </div>
        </div>
      </div>

      <!-- Games list -->
      <h2 class="text-lg font-bold text-gray-800 mb-4">Games</h2>
      <div v-if="games.length" class="space-y-3">
        <GameCard v-for="game in games" :key="game.id" :game="game" />
      </div>
      <p v-else class="text-gray-500 text-sm">
        No games associated with this tournament yet.
      </p>

      <!-- Top scorers -->
      <h2 class="text-lg font-bold text-gray-800 mt-8 mb-4">Top Scorers</h2>
      <div
        v-if="topScorers.length"
        class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
      >
        <div
          v-for="(entry, idx) in topScorers"
          :key="entry.playerId"
          class="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0"
        >
          <span class="text-sm font-bold text-gray-400 w-5">{{ idx + 1 }}</span>
          <NuxtLink
            :to="`/players/${entry.playerId}`"
            class="flex-1 text-sm font-medium text-gray-800 hover:text-brand truncate"
            >{{ entry.playerName }}</NuxtLink
          >
          <span class="text-sm font-bold text-brand">{{ entry.goals }} ⚽</span>
          <span class="text-xs text-gray-500">{{ entry.assists }} 🅰️</span>
        </div>
      </div>
      <p v-else class="text-gray-500 text-sm">No scorer data yet.</p>
    </template>
    <div v-else class="text-center py-16 text-gray-500">
      Tournament not found.
    </div>
  </div>
</template>
