<script setup lang="ts">
const props = defineProps<{
  mode: string;
  years?: { value: string; label: string }[];
  tournaments?: { id: string; name: string }[];
  rivals?: { id: string; name: string }[];
  players?: { id: string; name: string }[];
}>();

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
      <option v-for="y in years" :key="y.value" :value="y.value">
        {{ y.label }}
      </option>
    </select>

    <!-- Tournament filter -->
    <select
      v-if="mode === 'tournaments'"
      v-model="tournamentValue"
      class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
      @change="emit('change:tournament', tournamentValue)"
    >
      <option value="">Todos los torneos</option>
      <option v-for="t in tournaments" :key="t.id" :value="t.id">
        {{ t.name }}
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
      <option v-for="r in rivals" :key="r.id" :value="r.id">
        {{ r.name }}
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
      <option v-for="p in players" :key="p.id" :value="p.id">
        {{ p.name }}
      </option>
    </select>
  </div>
</template>
