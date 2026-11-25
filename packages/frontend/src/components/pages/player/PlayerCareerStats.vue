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
    { label: "Partidos", value: s?.appearances ?? 0 },
    { label: "Goles", value: s?.goalsScored ?? 0 },
    { label: "Asistencias", value: s?.assists ?? 0 },
    { label: "Amarillas", value: s?.yellowCards ?? 0 },
    { label: "Rojas", value: s?.redCards ?? 0 },
  ];
});

function onYearChange(e: Event) {
  emit("year-change", (e.target as HTMLSelectElement).value);
}
</script>

<template>
  <section aria-labelledby="career-stats">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <h2 id="career-stats" class="sheet-display text-3xl">
        Estadísticas de carrera
      </h2>
      <label class="block">
        <span class="sheet-label">Año</span>
        <select
          :value="year"
          class="sheet-field mt-1 !w-auto"
          @change="onYearChange"
        >
          <option value="">Todos los años</option>
          <option v-for="y in availableYears" :key="y" :value="String(y)">
            {{ y }}
          </option>
        </select>
      </label>
    </div>
    <dl
      v-if="stats"
      class="mt-3 grid grid-cols-2 border-y-[3px] border-[var(--sheet-ink)] sm:grid-cols-5"
    >
      <div
        v-for="stat in statCards"
        :key="stat.label"
        class="border-b border-[var(--sheet-rule)] px-1 py-3 sm:border-b-0 sm:border-r sm:last:border-r-0"
      >
        <dt class="sheet-label">{{ stat.label }}</dt>
        <dd class="sheet-display sheet-num mt-1 text-5xl">{{ stat.value }}</dd>
      </div>
    </dl>
    <p v-else class="mt-4">Sin estadísticas para este período.</p>
  </section>
</template>
