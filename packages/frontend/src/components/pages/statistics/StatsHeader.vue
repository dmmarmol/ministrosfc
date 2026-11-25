<script setup lang="ts">
import type { TeamSummaryHeaderDTO } from "@ministrosfc/shared";

const props = defineProps<{ summary: TeamSummaryHeaderDTO | null }>();

const totals = computed(() => {
  const s = props.summary;
  if (!s) return [];
  return [
    { label: "Partidos", value: s.totalGames },
    { label: "Victorias", value: s.totalWins },
    { label: "Empates", value: s.totalDraws },
    { label: "Derrotas", value: s.totalLosses },
    { label: "Goles a favor", value: s.totalGoalsFor },
    { label: "Goles en contra", value: s.totalGoalsAgainst },
    { label: "% Victorias", value: `${Number(s.winRate).toFixed(1)}%` },
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
    r("Rival más jugado", s.rivalMostPlayed),
    r("Más victorias contra", s.rivalMostWins),
    r("Más derrotas contra", s.rivalMostLosses),
    r("Más empates contra", s.rivalMostDraws),
  ];
});
</script>

<template>
  <div v-if="summary" class="mt-6">
    <dl class="grid grid-cols-2 border-y-[3px] border-[var(--sheet-ink)] sm:grid-cols-4">
      <div
        v-for="t in totals"
        :key="t.label"
        class="border-b border-r border-[var(--sheet-rule)] px-3 py-3 [&:last-child:nth-child(odd)]:col-span-2 sm:[&:last-child:nth-child(odd)]:col-span-1"
      >
        <dt class="sheet-label">{{ t.label }}</dt>
        <dd class="sheet-display sheet-num mt-1 text-5xl">{{ t.value }}</dd>
      </div>
    </dl>
    <h2 class="sheet-display mt-8 text-3xl">Récords contra rivales</h2>
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
