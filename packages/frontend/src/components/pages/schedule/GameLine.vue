<script setup lang="ts">
import { computed } from "vue";
import {
  GameStatus,
  formatDate,
  formatTime,
  type Game,
} from "@ministrosfc/shared";
import HomeArrow from "../home/HomeArrow.vue";


const { t } = useI18n();
const props = defineProps<{ game: Game }>();

const completed = computed(() => props.game.status === GameStatus.COMPLETED);
const cancelled = computed(() => props.game.status === GameStatus.CANCELLED);
const hasScore = computed(
  () => props.game.homeTeamScore != null && props.game.awayTeamScore != null,
);
const outcome = computed(() => {
  if (!hasScore.value) return t("scheduleGameLine.sinDato");
  const h = props.game.homeTeamScore!;
  const a = props.game.awayTeamScore!;
  return h > a ? t("common.victoria") : h === a ? t("common.empate") : t("common.derrota");
});
const day = computed(() => formatDate(props.game.date, { day: "numeric" }));
const weekday = computed(() =>
  formatDate(props.game.date, { weekday: "short" }).replace(/[.,]/g, ""),
);
const time = computed(
  () =>
    props.game.time?.slice(0, 5) ||
    formatTime(props.game.date, { hour: "2-digit", minute: "2-digit", hour12: false }),
);
const venue = computed(
  () => props.game.playground?.name ?? props.game.location ?? null,
);
const url = computed(() => `/games/${props.game.slug || props.game.id}`);
const label = computed(
  () =>
    `vs ${props.game.opponentTeam?.name ?? t("common.rivalAConfirmar")}, ${weekday.value} ${day.value}` +
    (completed.value ? `, ${hasScore.value ? `${props.game.homeTeamScore} a ${props.game.awayTeamScore}, ` : ""}${outcome.value}` : ""),
);
</script>

<template>
  <NuxtLink
    :to="url"
    :aria-label="label"
    class="grid min-h-[4.5rem] grid-cols-[3.25rem_1fr_auto] items-center gap-x-3 py-3 no-underline hover:bg-[var(--sheet-paper)]"
  >
    <span class="text-center" aria-hidden="true">
      <span class="sheet-label block">{{ weekday }}</span>
      <span class="sheet-display sheet-num block text-3xl leading-none">{{ day }}</span>
    </span>
    <span class="min-w-0" aria-hidden="true">
      <span
        class="sheet-display block break-words text-2xl"
        :class="cancelled && 'line-through decoration-[var(--sheet-blue)] decoration-[3px]'"
        >{{ t("common.vs", { name: game.opponentTeam?.name ?? t("common.rivalAConfirmar") }) }}</span
      >
      <span class="sheet-num block text-sm text-[var(--sheet-ink-soft)]"
        >{{ time }} h<template v-if="venue"> · {{ venue }}</template></span
      >
    </span>
    <span class="text-right" aria-hidden="true">
      <template v-if="completed">
        <span class="sheet-display sheet-num block text-4xl leading-none">
          <template v-if="hasScore">{{ game.homeTeamScore }}–{{ game.awayTeamScore }}</template>
          <template v-else>–</template>
        </span>
        <span
          class="sheet-label mt-0.5 inline-block"
          :class="outcome === 'Victoria' && 'bg-[var(--sheet-ink)] px-1.5 !text-[var(--sheet-paper)]'"
          >{{ outcome }}</span
        >
      </template>
      <template v-else-if="cancelled">
        <span class="sheet-label">{{ t("common.anulado") }}</span>
      </template>
      <HomeArrow v-else class="text-[var(--sheet-blue)]" />
    </span>
  </NuxtLink>
</template>
