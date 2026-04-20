<script setup lang="ts">
const model = defineModel<string>({ default: "" });
const { availableRivals } = useStatisticsAvailableRivals();
</script>

<template>
  <select
    v-model="model"
    class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
  >
    <option value="">Todos los rivales</option>
    <option v-for="r in availableRivals" :key="r.value" :value="r.value">
      {{ r.label }}
    </option>
  </select>
</template>
