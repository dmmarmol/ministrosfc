<script setup lang="ts">
import {
  DEFAULT_DATE_LOCALE,
  formatDate,
  getInitials,
  type Game,
  GameStatus,
} from "@ministrosfc/shared";

type Props = {
  game: Game;
};
const props = defineProps<Props>();

const statusLabel = computed(() => {
  const map: Record<GameStatus, string> = {
    SCHEDULED: "Upcoming",
    IN_PROGRESS: "Live",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
  };
  return map[props.game?.status as GameStatus] ?? props.game?.status ?? "";
});
const statusClass = computed(() => {
  const map: Record<GameStatus, string> = {
    SCHEDULED: "bg-blue-500/20 text-blue-300",
    IN_PROGRESS: "bg-green-500/20 text-green-300",
    COMPLETED: "bg-gray-500/20 text-gray-300",
    CANCELLED: "bg-red-500/20 text-red-300",
  };
  return map[props.game?.status as GameStatus] ?? "";
});
</script>
<template>
  <div class="bg-gray-900 text-white rounded-2xl p-6">
    <p class="text-xs text-gray-400 uppercase tracking-wider mb-1">
      {{
        formatDate(
          props.game.date,
          { month: "long", day: "numeric", year: "numeric" },
          DEFAULT_DATE_LOCALE,
        )
      }}
      ·
      {{ props.game.playground?.name ?? props.game.location ?? "TBD" }}
    </p>
    <div class="grid lg:grid-cols-3 gap-4">
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
          v-if="props.game.status === GameStatus.COMPLETED"
          class="text-4xl font-bold"
        >
          {{ props.game.homeTeamScore }} – {{ props.game.awayTeamScore }}
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
          <span v-else>{{ getInitials(game.opponentTeam?.name) }}</span>
        </div>
        <span class="text-xl font-bold">{{ game.opponentTeam?.name }}</span>
      </div>
    </div>
  </div>
</template>
