<script setup lang="ts">
import { formatDate } from "~/utils/formatDate";
const props = defineProps<{
  game: {
    date: string;
    playground?: { name: string } | null;
    status: string;
    homeTeamScore?: number | null;
    awayTeamScore?: number | null;
    opponentTeam?: { name: string } | null;
    slug?: string | null;
  };
}>();

const emit = defineEmits<{
  "copy-signup-link": [];
}>();

</script>

<template>
  <div class="bg-gray-900 text-white rounded-2xl p-6 mb-6">
    <p class="text-xs text-gray-400 uppercase tracking-wider mb-2">
      {{ formatDate(game.date, { weekday: "long", month: "long", day: "numeric", year: "numeric" }) }}
      <span v-if="game.playground?.name"> · {{ game.playground.name }}</span>
    </p>
    <div class="flex items-center justify-between gap-4">
      <span class="text-xl font-bold">Ministros FC</span>
      <div class="text-center">
        <p v-if="game.status === 'COMPLETED'" class="text-3xl font-bold">
          {{ game.homeTeamScore ?? 0 }} – {{ game.awayTeamScore ?? 0 }}
        </p>
        <p v-else class="text-lg text-gray-400">vs</p>
        <span
          class="text-xs px-2 py-0.5 rounded-full font-semibold mt-1 inline-block"
          :class="{
            'bg-blue-500/20 text-blue-300': game.status === 'SCHEDULED',
            'bg-green-500/20 text-green-300': game.status === 'IN_PROGRESS',
            'bg-gray-500/20 text-gray-300': game.status === 'COMPLETED',
            'bg-red-500/20 text-red-300': game.status === 'CANCELLED',
          }"
        >
          {{
            ({
              SCHEDULED: "Programado",
              IN_PROGRESS: "En juego",
              COMPLETED: "Completado",
              CANCELLED: "Cancelado",
            } as Record<string, string>)[game.status] ?? game.status
          }}
        </span>
      </div>
      <span class="text-xl font-bold">{{ game.opponentTeam?.name }}</span>
    </div>
    <div
      v-if="game.status === 'SCHEDULED' && game.slug"
      class="mt-4 pt-4 border-t border-white/10"
    >
      <button
        class="text-sm text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
        @click="emit('copy-signup-link')"
      >
        📋 Copiar link de convocatoria
      </button>
    </div>
  </div>
</template>
