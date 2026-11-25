<script setup lang="ts">
import type { PlayerStats } from "~/composables/useGetPlayerStatsById";


const { t } = useI18n();
const props = defineProps<{
  stats: PlayerStats | null;
  availableYears: number[];
  year: string | undefined;
}>();

const emit = defineEmits<{ "year-change": [year: string] }>();

const statCards = computed(() => {
  const s = props.stats;
  return [
    { label: t("common.partidos"), value: s?.appearances ?? 0 },
    { label: t("common.goles"), value: s?.goalsScored ?? 0 },
    { label: t("common.asistencias"), value: s?.assists ?? 0 },
    { label: t("playerPlayerCareerStats.amarillas"), value: s?.yellowCards ?? 0 },
    { label: t("common.rojas"), value: s?.redCards ?? 0 },
  ];
});

function onYearChange(e: Event) {
  emit("year-change", (e.target as HTMLSelectElement).value);
}
</script>

<template>
  <section aria-labelledby="career-stats">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <UiSheetHeading id="career-stats">{{ t("playerPlayerCareerStats.estadisticasDeCarrera") }}</UiSheetHeading>
      <label class="block">
        <span class="sheet-label">{{ t("common.ano") }}</span>
        <select
          :value="year"
          class="sheet-field mt-1 !w-auto"
          @change="onYearChange"
        >
          <option value="">{{ t("common.todosLosAnos") }}</option>
          <option v-for="y in availableYears" :key="y" :value="String(y)">
            {{ y }}
          </option>
        </select>
      </label>
    </div>
    <UiSheetTotals v-if="stats" :items="statCards" :columns="5" class="mt-3" />
    <p v-else class="mt-4">{{ t("playerPlayerCareerStats.sinEstadisticasParaEste") }}</p>
  </section>
</template>
