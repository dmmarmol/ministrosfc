<script setup lang="ts">
const props = defineProps<{ status?: string }>();
const model = defineModel<string>({ default: "" });

const statusRef = computed(() => props.status);
const { availablePlayers } = useStatisticsAvailablePlayers(statusRef);

// Clear selected player when it is no longer present in the filtered list.
watch(availablePlayers, () => {
  if (!model.value) return;
  if (!availablePlayers.value.some((p) => p.value === model.value)) {
    model.value = "";
  }
});
</script>

<template>
  <select
    v-model="model"
    class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
  >
    <option value="">Todos los jugadores</option>
    <option v-for="p in availablePlayers" :key="p.value" :value="p.value">
      {{ p.label }}
    </option>
  </select>
</template>
