<script setup lang="ts">
import type { StatsFiltersMode } from "@ministrosfc/shared";

const props = defineProps<{
  mode: StatsFiltersMode | "player" | "rival";
}>();

const { availableYears } = useStatisticsAvailableYears();
const { availableTournaments } = useStatisticsAvailableTournaments();
const { availableRivals } = useStatisticsAvailableRivals();
const { availablePlayers } = useStatisticsAvailablePlayers();

const emit = defineEmits<{
  "change:year": [value: string];
  "change:tournament": [value: string];
  "change:rival": [value: string];
  "change:player": [value: string];
}>();

const yearValue = defineModel<string>("year", { default: "" });
const tournamentValue = defineModel<string>("tournament", { default: "" });
const rivalValue = defineModel<string>("rival", { default: "" });
const playerValue = defineModel<string>("player", { default: "" });
</script>

<template>
  <div class="flex flex-wrap gap-3">
    <!-- Year filter — always visible -->
    <select
      v-model="yearValue"
      class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
      @change="emit('change:year', yearValue)"
    >
      <option value="">Todos los años</option>
      <option v-for="y in availableYears" :key="y.value" :value="y.value">
        {{ y.label }}
      </option>
    </select>

    <!-- Tournament filter -->
    <select
      v-if="mode === 'tournaments' || mode === 'rivals'"
      v-model="tournamentValue"
      class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
      @change="emit('change:tournament', tournamentValue)"
    >
      <option value="">Todos los torneos</option>
      <option v-for="t in availableTournaments" :key="t.value" :value="t.value">
        {{ t.label }}
      </option>
    </select>

    <!-- Rival filter -->
    <select
      v-if="mode === 'rivals' || mode === 'rival'"
      v-model="rivalValue"
      class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
      @change="emit('change:rival', rivalValue)"
    >
      <option value="">Todos los rivales</option>
      <option v-for="r in availableRivals" :key="r.value" :value="r.value">
        {{ r.label }}
      </option>
    </select>

    <!-- Player filter -->
    <select
      v-if="mode === 'players' || mode === 'player'"
      v-model="playerValue"
      class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
      @change="emit('change:player', playerValue)"
    >
      <option value="">Todos los jugadores</option>
      <option v-for="p in availablePlayers" :key="p.value" :value="p.value">
        {{ p.label }}
      </option>
    </select>
  </div>
</template>
