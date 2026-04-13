<script setup lang="ts">
import { formatDate, formatTime } from "~/utils/formatDate";
import { type GameSignupPageDTO } from "@ministrosfc/shared";

const props = defineProps<{
  game: GameSignupPageDTO["game"];
  maxPlayers: number | null;
}>();
</script>

<template>
  <div
    class="flex flex-col justify-between gap-y-1 flex-1 bg-gray-900 text-white rounded-2xl p-6"
  >
    <p
      v-if="game.playground?.name || game.location"
      class="text-xs text-gray-400 uppercase tracking-wider"
    >
      <span>{{ game.playground?.name ?? game.location }}</span>
    </p>
    <div class="grid grid-cols-5 items-baseline justify-between gap-2 mb-4">
      <span class="col-span-2 text-lg font-bold text-left">Ministros FC</span>
      <span class="col-span-1 text-gray-400 text-center">vs</span>
      <span class="col-span-2 text-lg font-bold text-right">{{
        game.opponentTeam?.name
      }}</span>
    </div>
    <div class="flex items-baseline justify-between">
      <p class="text-sm text-gray-300">
        {{
          formatDate(game.date, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })
        }}
        <span v-if="game.date.includes('T')">
          · {{ formatTime(game.date) }}</span
        >
      </p>
    </div>
  </div>
</template>
