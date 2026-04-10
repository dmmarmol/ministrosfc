<script setup lang="ts">
const props = defineProps<{
  game: {
    date: string;
    playground?: { name: string } | null;
    opponentTeam?: { name: string } | null;
    maxPlayers?: number | null;
  };
  confirmedCount: number;
}>();

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("es-AR", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}
</script>

<template>
  <div class="bg-gray-900 text-white rounded-2xl p-6 mb-6">
    <p class="text-xs text-gray-400 uppercase tracking-wider mb-1">
      {{ formatDate(game.date) }}
      <span v-if="game.playground?.name"> · {{ game.playground.name }}</span>
    </p>
    <div class="flex items-center justify-between gap-2">
      <span class="text-lg font-bold">Ministros FC</span>
      <span class="text-gray-400">vs</span>
      <span class="text-lg font-bold">{{ game.opponentTeam?.name }}</span>
    </div>
    <p class="text-sm text-gray-300 mt-2">
      Confirmados: <strong>{{ confirmedCount }}</strong>
      <span v-if="game.maxPlayers"> / {{ game.maxPlayers }}</span>
    </p>
  </div>
</template>
