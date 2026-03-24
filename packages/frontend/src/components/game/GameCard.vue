<template>
  <NuxtLink
    :to="`/games/${game.id}`"
    class="group bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 p-4 flex items-center gap-4"
  >
    <!-- Opponent logo -->
    <div
      class="w-12 h-12 rounded-full bg-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center"
    >
      <img
        v-if="game.opponentTeam?.logoUrl"
        :src="game.opponentTeam.logoUrl"
        :alt="game.opponentTeam.name"
        class="w-full h-full object-cover"
      />
      <span v-else class="text-lg font-bold text-gray-400">{{
        initials(game.opponentTeam?.name)
      }}</span>
    </div>
    <!-- Game info -->
    <div class="flex-1 min-w-0">
      <p class="font-semibold text-gray-900 text-sm truncate">
        vs {{ game.opponentTeam?.name ?? "Unknown" }}
      </p>
      <p class="text-xs text-gray-500 mt-0.5">
        {{ formatDate(game.date)
        }}{{ game.location ? ` · ${game.location}` : "" }}
      </p>
    </div>
    <!-- Score / Status -->
    <div class="flex-shrink-0 text-right">
      <template v-if="game.status === 'COMPLETED'">
        <p class="font-bold text-gray-900 text-lg leading-none">
          {{ game.homeTeamScore ?? 0 }} – {{ game.awayTeamScore ?? 0 }}
        </p>
        <p :class="resultClass" class="text-xs font-semibold mt-0.5">
          {{ resultLabel }}
        </p>
      </template>
      <template v-else>
        <span
          :class="statusClass"
          class="text-xs font-semibold px-2 py-0.5 rounded-full"
          >{{ statusLabel }}</span
        >
      </template>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  game: {
    id: string;
    date: string;
    location: string | null;
    status: string;
    homeTeamScore: number | null;
    awayTeamScore: number | null;
    opponentTeam: { name: string; logoUrl: string | null } | null;
  };
}>();

function initials(name?: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-AR", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const resultLabel = computed(() => {
  const h = props.game.homeTeamScore ?? 0;
  const a = props.game.awayTeamScore ?? 0;
  if (h > a) return "Victoria";
  if (h === a) return "Empate";
  return "Derrota";
});

const resultClass = computed(() => {
  const h = props.game.homeTeamScore ?? 0;
  const a = props.game.awayTeamScore ?? 0;
  if (h > a) return "text-green-600";
  if (h === a) return "text-yellow-600";
  return "text-red-600";
});

const statusLabel = computed(() => {
  const map: Record<string, string> = {
    SCHEDULED: "Próximo",
    IN_PROGRESS: "En vivo",
    CANCELLED: "Cancelado",
  };
  return map[props.game.status] ?? props.game.status;
});

const statusClass = computed(() => {
  const map: Record<string, string> = {
    SCHEDULED: "bg-blue-100 text-blue-700",
    IN_PROGRESS: "bg-green-100 text-green-700",
    CANCELLED: "bg-gray-100 text-gray-500",
  };
  return map[props.game.status] ?? "bg-gray-100 text-gray-500";
});
</script>
