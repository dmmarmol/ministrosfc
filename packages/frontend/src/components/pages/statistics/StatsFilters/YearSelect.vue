<script setup lang="ts">
const model = defineModel<string>({ default: "" });
const { availableYears } = useStatisticsAvailableYears();
</script>

<template>
  <select
    v-model="model"
    class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
  >
    <option value="">Todos los años</option>
    <option v-for="y in availableYears" :key="y.value" :value="y.value">
      {{ y.label }}
    </option>
  </select>
</template>
