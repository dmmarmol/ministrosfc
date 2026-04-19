<script setup lang="ts">
import type { StatsFiltersMode } from "@ministrosfc/shared";

const props = defineProps<{
  mode: StatsFiltersMode | "player" | "rival";
}>();

const needsTournaments = computed(
  () => props.mode === "tournaments" || props.mode === "rivals",
);
const needsRivals = computed(() => props.mode === "rivals");
const needsPlaygrounds = computed(
  () => props.mode === "rivals" || props.mode === "rival",
);
const needsPlayers = computed(
  () => props.mode === "players" || props.mode === "player",
);

const { availableYears } = useStatisticsAvailableYears();
const { availableTournaments } = useStatisticsAvailableTournaments(needsTournaments);
const { availableRivals } = useStatisticsAvailableRivals(needsRivals);
const { availablePlaygrounds } = useStatisticsAvailablePlaygrounds(needsPlaygrounds);

const emit = defineEmits<{
  "change:year": [value: string];
  "change:tournament": [value: string];
  "change:rival": [value: string];
  "change:player": [value: string];
  "change:playerStatus": [value: string];
  "change:playground": [value: string];
}>();

const yearValue = defineModel<string>("year", { default: "" });
const tournamentValue = defineModel<string>("tournament", { default: "" });
const rivalValue = defineModel<string>("rival", { default: "" });
const playerValue = defineModel<string>("player", { default: "" });
const playerStatusValue = defineModel<string>("playerStatus", {
  default: "ACTIVE",
});
const playgroundValue = defineModel<string>("playground", { default: "" });

const { availablePlayers } = useStatisticsAvailablePlayers(playerStatusValue, needsPlayers);

watch(
  [playerStatusValue, availablePlayers],
  () => {
    if (!playerValue.value) return;

    const hasCurrentPlayer = availablePlayers.value.some(
      (p) => p.value === playerValue.value,
    );

    // Keep player query param consistent with currently visible player options.
    if (!hasCurrentPlayer) {
      playerValue.value = "";
      emit("change:player", "");
    }
  },
  { immediate: true },
);
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
      v-if="mode === 'rivals'"
      v-model="rivalValue"
      class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
      @change="emit('change:rival', rivalValue)"
    >
      <option value="">Todos los rivales</option>
      <option v-for="r in availableRivals" :key="r.value" :value="r.value">
        {{ r.label }}
      </option>
    </select>

    <!-- Playground filter -->
    <select
      v-if="mode === 'rivals' || mode === 'rival'"
      v-model="playgroundValue"
      class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
      @change="emit('change:playground', playgroundValue)"
    >
      <option value="">Todas las canchas</option>
      <option v-for="p in availablePlaygrounds" :key="p.value" :value="p.value">
        {{ p.label }}
      </option>
    </select>

    <!-- Player status filter -->
    <select
      v-if="mode === 'players'"
      v-model="playerStatusValue"
      class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
      @change="emit('change:playerStatus', playerStatusValue)"
    >
      <option value="ACTIVE">Activos</option>
      <option value="INACTIVE">Inactivos</option>
      <option value="">Todos los estados</option>
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
