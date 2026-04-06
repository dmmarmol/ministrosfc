<script setup lang="ts">
const props = defineProps<{
  tournament: {
    id: string;
    name: string;
    format: string;
    startDate: string;
    endDate: string | null;
    ministrosRecord?: {
      wins: number;
      draws: number;
      losses: number;
      goalsFor: number;
      goalsAgainst: number;
      goalDifference: number;
    } | null;
  };
}>();

function formatFormat(fmt: string): string {
  return fmt.replace(/_/g, " ").toLowerCase();
}

function formatDateRange(start: string, end: string | null): string {
  const s = new Date(start).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
  if (!end) return `Since ${s}`;
  const e = new Date(end).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
  return `${s} – ${e}`;
}

const gdClass = computed(() => {
  const gd = props.tournament.ministrosRecord?.goalDifference ?? 0;
  if (gd > 0) return "text-green-600";
  if (gd < 0) return "text-red-600";
  return "text-gray-600";
});
</script>

<template>
  <NuxtLink
    :to="`/tournaments/${tournament.id}`"
    class="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 p-5 block"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="flex-1 min-w-0">
        <p class="font-semibold text-gray-900 truncate">
          {{ tournament.name }}
        </p>
        <p class="text-xs text-gray-500 mt-0.5 capitalize">
          {{ formatFormat(tournament.format) }}
        </p>
        <p class="text-xs text-gray-400 mt-1">
          {{ formatDateRange(tournament.startDate, tournament.endDate) }}
        </p>
      </div>
      <div v-if="tournament.ministrosRecord" class="flex-shrink-0 text-right">
        <p class="text-2xl font-bold text-gray-900 leading-none">
          {{ tournament.ministrosRecord.wins }}–{{
            tournament.ministrosRecord.draws
          }}–{{ tournament.ministrosRecord.losses }}
        </p>
        <p class="text-xs text-gray-500 mt-1">W–D–L</p>
      </div>
    </div>
    <div
      v-if="tournament.ministrosRecord"
      class="mt-3 pt-3 border-t border-gray-100 flex gap-4 text-xs text-gray-600"
    >
      <span>⚽ {{ tournament.ministrosRecord.goalsFor }} scored</span>
      <span>🥅 {{ tournament.ministrosRecord.goalsAgainst }} conceded</span>
      <span class="ml-auto font-semibold" :class="gdClass"
        >GD {{ tournament.ministrosRecord.goalDifference >= 0 ? "+" : ""
        }}{{ tournament.ministrosRecord.goalDifference }}</span
      >
    </div>
  </NuxtLink>
</template>
