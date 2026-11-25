<script setup lang="ts">
import { computed } from "vue";
import { formatDate, type Game } from "@ministrosfc/shared";
import HomeListSection from "./HomeListSection.vue";


const { t } = useI18n();
interface Scorer {
  player?: { id: string; firstName: string; lastName: string };
  goalsScored: number;
}

const props = defineProps<{
  results: Game[];
  scorers: Scorer[];
  resultsLoading?: boolean;
  scorersLoading?: boolean;
}>();

// The home page shows the top five
const topScorers = computed(() => props.scorers.slice(0, 5));

const scored = (g: Game) => g.homeTeamScore != null && g.awayTeamScore != null;
function outcome(g: Game) {
  if (!scored(g)) return t("homeHomeArchive.sinResultadoCargado");
  const h = g.homeTeamScore!;
  const a = g.awayTeamScore!;
  return h > a ? t("common.victoria") : h === a ? t("common.empate") : t("common.derrota");
}
</script>

<template>
  <div class="sheet-paper">
    <div class="mx-auto grid max-w-3xl gap-10 px-4 py-10 md:grid-cols-2">
      <HomeListSection
        id="home-results"
        :title="t('common.resultados')"
        :items="results"
        :item-key="(g: Game) => g.id"
        :loading="resultsLoading"
        :empty-text="t('common.todaviaNoHayPartidos')"
        link-to="/schedule"
        link-label="Calendario completo"
      >
        <template #item="{ item: g }">
          <NuxtLink
            :to="`/games/${g.slug || g.id}`"
            class="flex min-h-14 items-center gap-3 py-3 no-underline hover:bg-[var(--sheet-paper)]"
          >
            <span class="sheet-display sheet-num w-20 shrink-0 text-4xl">
              <template v-if="scored(g)"
                >{{ g.homeTeamScore }}–{{ g.awayTeamScore }}</template
              ><template v-else>–</template>
            </span>
            <span class="min-w-0 flex-1">
              <span class="block truncate font-bold">
                {{ t("common.vs", { name: g.opponentTeam?.name }) }}
              </span>
              <span class="sheet-num block text-sm text-[var(--sheet-ink-soft)]">
                {{ outcome(g) }} ·
                {{ formatDate(g.date, { day: "numeric", month: "short" }) }}
              </span>
            </span>
          </NuxtLink>
        </template>
      </HomeListSection>

      <HomeListSection
        id="home-scorers"
        :title="t('common.goleadores')"
        ordered
        :items="topScorers"
        :item-key="(s: Scorer, i: number) => s.player?.id ?? i"
        :loading="scorersLoading"
        :empty-text="t('homeHomeArchive.sinDatosDeGoleadores')"
        link-to="/statistics/top-scorers"
        link-label="Tabla completa"
      >
        <template #item="{ item: s, index: i }">
          <NuxtLink
            :to="`/players/${s.player?.id}`"
            class="flex min-h-12 items-center gap-3 py-2.5 no-underline hover:bg-[var(--sheet-paper)]"
          >
            <span
              class="sheet-num w-7 font-bold text-[var(--sheet-blue)]"
              aria-hidden="true"
              >{{ String(i + 1).padStart(2, "0") }}</span
            >
            <span class="min-w-0 flex-1 truncate font-bold"
              >{{ s.player?.firstName }} {{ s.player?.lastName }}</span
            >
            <span class="sheet-display sheet-num text-3xl"
              >{{ s.goalsScored }}<span class="sr-only">{{ " " + t("common.goles") }}</span></span
            >
          </NuxtLink>
        </template>
      </HomeListSection>
    </div>
  </div>
</template>
