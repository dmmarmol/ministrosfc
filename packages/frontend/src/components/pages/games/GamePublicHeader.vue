<script setup lang="ts">
import { GameStatus } from "@ministrosfc/shared";
import { formatDate } from "~/utils/formatDate";
const props = defineProps<{
  game: {
    date: string;
    location?: string | null;
    playground?: { name: string } | null;
    status: string;
    homeTeamScore?: number | null;
    awayTeamScore?: number | null;
    opponentTeam?: { name: string; logoUrl?: string | null } | null;
  };
  statusLabel: string;
  statusClass: string;
}>();

function initials(name?: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
</script>

<template>
  <div class="bg-gray-900 text-white rounded-2xl p-6 mb-8">
    <p class="text-xs text-gray-400 uppercase tracking-wider mb-1">
      {{
        formatDate(
          game.date,
          { month: "long", day: "numeric", year: "numeric" },
          "en-US",
        )
      }}
      ·
      {{ game.playground?.name ?? game.location ?? "TBD" }}
    </p>
    <div class="flex items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div
          class="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg"
        >
          M
        </div>
        <span class="text-xl font-bold">Ministros FC</span>
      </div>
      <div class="text-center">
        <p
          v-if="game.status === GameStatus.COMPLETED"
          class="text-4xl font-bold"
        >
          {{ game.homeTeamScore }} – {{ game.awayTeamScore }}
        </p>
        <p v-else class="text-lg text-gray-400">vs</p>
        <span
          :class="statusClass"
          class="text-xs font-semibold px-2 py-0.5 rounded-full mt-1 inline-block"
          >{{ statusLabel }}</span
        >
      </div>
      <div class="flex items-center gap-3 flex-row-reverse">
        <div
          class="w-12 h-12 rounded-full bg-white/20 overflow-hidden flex items-center justify-center font-bold text-lg"
        >
          <img
            v-if="game.opponentTeam?.logoUrl"
            :src="game.opponentTeam.logoUrl"
            class="w-full h-full object-cover"
          />
          <span v-else>{{ initials(game.opponentTeam?.name) }}</span>
        </div>
        <span class="text-xl font-bold">{{ game.opponentTeam?.name }}</span>
      </div>
    </div>
  </div>
</template>
