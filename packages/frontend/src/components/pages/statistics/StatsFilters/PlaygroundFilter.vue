<script setup lang="ts">
const model = defineModel<string>({ default: "" });
const { availablePlaygrounds } = useStatisticsAvailablePlaygrounds();
</script>

<template>
  <select
    v-model="model"
    class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
  >
    <option value="">Todas las canchas</option>
    <option v-for="p in availablePlaygrounds" :key="p.value" :value="p.value">
      {{ p.label }}
    </option>
  </select>
</template>
