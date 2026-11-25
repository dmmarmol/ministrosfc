<script setup lang="ts">
import { formatCompetitionType, formatDateRange } from "~/utils/stats";
import type { MinistrosRecord } from "@ministrosfc/shared";
import HomeArrow from "~/components/pages/home/HomeArrow.vue";

const { t } = useI18n();

const props = defineProps<{
  tournament: {
    id: string;
    name: string;
    competitionType: string;
    startDate: string;
    endDate: string | null;
    /** Absent on older cached responses; nothing is shown then. */
    ministrosRecord?: Pick<MinistrosRecord, "played" | "wins" | "draws" | "losses">;
  };
  /** Optional state tag (t("common.proximo"), t("common.enCurso")). */
  statusLabel?: string | null;
}>();

// A record is only worth a line once a game has been played
const record = computed(() => {
  const r = props.tournament.ministrosRecord;
  return r && r.played > 0 ? r : null;
});
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
      <span
        v-if="record"
        data-testid="tournament-record"
        class="sheet-num mt-0.5 block text-sm font-bold"
        :aria-label="t('tournaments.recordLabel', record)"
        >{{ t("tournaments.record", record) }}</span
      >
    </span>
    <span class="flex items-center gap-3 text-right">
      <span v-if="statusLabel" class="sheet-label">{{ statusLabel }}</span>
      <HomeArrow class="text-[var(--sheet-blue)]" />
    </span>
  </NuxtLink>
</template>
