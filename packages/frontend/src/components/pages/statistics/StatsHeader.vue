<script setup lang="ts">
import type { TeamSummaryHeaderDTO } from "@ministrosfc/shared";


const { t } = useI18n();
const props = defineProps<{ summary: TeamSummaryHeaderDTO | null }>();

const totals = computed(() => {
  const s = props.summary;
  if (!s) return [];
  return [
    { label: t("common.partidos"), value: s.totalGames },
    { label: t("common.victorias"), value: s.totalWins },
    { label: t("common.empates"), value: s.totalDraws },
    { label: t("common.derrotas"), value: s.totalLosses },
    { label: t("common.golesAFavor"), value: s.totalGoalsFor },
    { label: t("common.golesEnContra"), value: s.totalGoalsAgainst },
    { label: t("stats.winRate"), value: `${Number(s.winRate).toFixed(1)}%` },
  ];
});
const records = computed(() => {
  const s = props.summary;
  if (!s) return [];
  const r = (l: string, v?: { name?: string; count?: number } | null) => ({
    label: l,
    value: v?.name ? `${v.name} (${v.count ?? 0})` : "—",
  });
  return [
    r(t("statisticsStatsHeader.rivalMasJugado"), s.rivalMostPlayed),
    r(t("statisticsStatsHeader.masVictoriasContra"), s.rivalMostWins),
    r(t("statisticsStatsHeader.masDerrotasContra"), s.rivalMostLosses),
    r(t("statisticsStatsHeader.masEmpatesContra"), s.rivalMostDraws),
  ];
});
</script>

<template>
  <div v-if="summary" class="mt-6">
    <UiSheetTotals :items="totals" />
    <UiSheetHeading class="mt-8">{{ t("statisticsStatsHeader.recordsContraRivales") }}</UiSheetHeading>
    <dl class="mt-2 border-t-[3px] border-[var(--sheet-ink)]">
      <div
        v-for="r in records"
        :key="r.label"
        class="flex flex-wrap items-baseline justify-between gap-x-4 border-b border-[var(--sheet-rule)] py-3"
      >
        <dt class="sheet-label">{{ r.label }}</dt>
        <dd class="font-bold">{{ r.value }}</dd>
      </div>
    </dl>
  </div>
</template>
