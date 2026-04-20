<script setup lang="ts">
const model = defineModel<string>({ default: "" });
const { availableTournaments } = useStatisticsAvailableTournaments();
</script>

<template>
  <select
    v-model="model"
    class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
  >
    <option value="">Todos los torneos</option>
    <option v-for="t in availableTournaments" :key="t.value" :value="t.value">
      {{ t.label }}
    </option>
  </select>
</template>
