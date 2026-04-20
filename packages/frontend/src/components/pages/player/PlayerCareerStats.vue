<script setup lang="ts">
import type { PlayerStats } from "~/composables/useGetPlayerStatsById";

const props = defineProps<{
  stats: PlayerStats | null;
  availableYears: number[];
  year: string | undefined;
}>();

const emit = defineEmits<{ "year-change": [year: string] }>();

const statCards = computed(() => {
  const s = props.stats;
  return [
    { label: "Goles", value: s?.goalsScored ?? 0 },
    { label: "Asistencias", value: s?.assists ?? 0 },
    { label: "Partidos", value: s?.appearances ?? 0 },
    { label: "Tarjetas amarillas", value: s?.yellowCards ?? 0 },
    { label: "Tarjetas rojas", value: s?.redCards ?? 0 },
    // { label: "Minutos", value: s?.totalMinutes ?? 0 },
  ];
});

function onYearChange(e: Event) {
  emit("year-change", (e.target as HTMLSelectElement).value);
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-bold text-gray-800">Estadísticas de carrera</h2>
      <select
        :value="year"
        class="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand"
        @change="onYearChange"
      >
        <option value="">Todos los años</option>
        <option v-for="y in availableYears" :key="y" :value="String(y)">
          {{ y }}
        </option>
      </select>
    </div>
    <div v-if="stats" class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
      <div
        v-for="stat in statCards"
        :key="stat.label"
        class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center"
      >
        <p class="text-2xl font-bold text-gray-900">{{ stat.value }}</p>
        <p class="text-xs text-gray-500 mt-1">{{ stat.label }}</p>
      </div>
    </div>
  </div>
</template>
