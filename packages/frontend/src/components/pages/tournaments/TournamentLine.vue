<script setup lang="ts">
import { formatCompetitionType, formatDateRange } from "~/utils/stats";
import HomeArrow from "~/components/pages/home/HomeArrow.vue";

const { t } = useI18n();

defineProps<{
  tournament: {
    id: string;
    name: string;
    competitionType: string;
    startDate: string;
    endDate: string | null;
  };
  /** Optional state tag (t("common.proximo"), t("common.enCurso")). */
  statusLabel?: string | null;
}>();
</script>

<template>
  <NuxtLink
    :to="`/tournaments/${tournament.id}`"
    class="grid min-h-[4.5rem] grid-cols-[1fr_auto] items-center gap-x-3 py-3 no-underline hover:bg-[var(--sheet-ground)]"
  >
    <span class="min-w-0">
      <span class="sheet-display block break-words text-2xl">{{ tournament.name }}</span>
      <span class="sheet-num block text-sm text-[var(--sheet-ink-soft)]"
        >{{ formatCompetitionType(tournament.competitionType) }} ·
        {{ formatDateRange(tournament.startDate, tournament.endDate) }}</span
      >
    </span>
    <span class="flex items-center gap-3 text-right">
      <span v-if="statusLabel" class="sheet-label">{{ statusLabel }}</span>
      <HomeArrow class="text-[var(--sheet-blue)]" />
    </span>
  </NuxtLink>
</template>
