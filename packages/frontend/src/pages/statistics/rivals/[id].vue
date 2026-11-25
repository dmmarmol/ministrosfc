<script setup lang="ts">
import StatsField from "~/components/pages/statistics/StatsField.vue";
import type { ApiResponse, TeamStatPeriodDTO } from "@ministrosfc/shared";
import StatsTitle from "~/components/pages/statistics/StatsTitle.vue";
import YearSelect from "~/components/pages/statistics/StatsFilters/YearSelect.vue";
import StatsFilterBar from "~/components/pages/statistics/StatsFilterBar.vue";
import PlaygroundSelect from "~/components/pages/admin/playground/PlaygroundSelect.vue";
import { useStatsFilters } from "~/composables/useStatsFilters";


const { t } = useI18n();
definePageMeta({
  layout: "statistics",
  public: true,
});

const route = useRoute();
const rivalId = route.params.id as string;
useHead({ title: t("rivalsDetail.estadisticasPorRival") });

const { $api } = useNuxtApp();
const {
  year: yearFilter,
  playgroundId: playgroundFilter,
  filters,
} = useStatsFilters();

const [{ data: teamData }, { data, pending, refresh }] = await Promise.all([
  useAsyncData(`rival-team-${rivalId}`, () =>
    $api<{ data: { name: string } }>(`/api/v1/opponent-teams/${rivalId}`),
  ),
  useAsyncData(
    `rival-stats-${rivalId}`,
    () =>
      $api<ApiResponse<TeamStatPeriodDTO[]>>(
        `/api/v1/statistics/team/rivals/${rivalId}`,
        {
          query: {
            ...(filters.value.year ? { year: filters.value.year } : {}),
            ...(filters.value.playgroundId
              ? { playgroundId: filters.value.playgroundId }
              : {}),
          },
        },
      ),
    { server: false },
  ),
]);

const rivalName = computed(() => teamData.value?.data?.name ?? rivalId);

const tableRows = computed(() =>
  (data.value?.data ?? []).map((row) => ({
    year: row.label,
    games: row.gamesPlayed,
    wins: row.wins,
    losses: row.losses,
    draws: row.draws,
    goalsFor: row.goalsFor,
    goalsAgainst: row.goalsAgainst,
    goalDiff: row.goalsFor - row.goalsAgainst,
    winRate: row.winRate,
    matches: row.matches ?? [],
  })),
);

watch(
  () => route.query,
  () => refresh(),
);
</script>

<template>
  <div>
    <UiBackButton to="/statistics/rivals" :label="t('rivalsDetail.rivales')" />
    <StatsTitle>{{ t("common.vs", { name: rivalName }) }}</StatsTitle>
    <StatsFilterBar>
      <StatsField :label="t('common.ano')"><YearSelect v-model="yearFilter" /></StatsField>
      <StatsField :label="t('common.cancha')"><PlaygroundSelect v-model="playgroundFilter" :placeholder="t('common.todas')" /></StatsField>
    </StatsFilterBar>

    <UiSheetMessage v-if="pending" class="mt-6">{{ t("common.cargando") }}</UiSheetMessage>
    <p v-else-if="tableRows.length === 0" class="mt-6">
      {{ t("rivalsDetail.noHayPartidosContra") }}
    </p>
    <div v-else class="mt-6 space-y-6">
      <details
        v-for="row in tableRows"
        :key="row.year"
        open
        class="border-t-[3px] border-[var(--sheet-ink)] bg-[var(--sheet-paper)]"
      >
        <summary
          class="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-3 py-3"
        >
          <span>
            <span class="sheet-display block text-4xl">{{ row.year }}</span>
            <span class="sheet-num flex flex-wrap gap-x-3 text-sm">
              <span class="whitespace-nowrap">{{ t("rivalDetail.played", row.games) }}</span>
              <span class="whitespace-nowrap">{{ t("rivalDetail.won", row.wins) }}</span>
              <span class="whitespace-nowrap">{{ t("rivalDetail.drawn", row.draws) }}</span>
              <span class="whitespace-nowrap">{{ t("rivalDetail.lost", row.losses) }}</span>
            </span>
            <span class="sheet-num block text-sm text-[var(--sheet-ink-soft)]">
              {{ t("rivalDetail.goalsSummary", { scored: row.goalsFor, conceded: row.goalsAgainst }) }}
            </span>
          </span>
          <span class="text-right">
            <span class="sheet-display sheet-num block text-4xl leading-none"
              >{{ Number(row.winRate).toFixed(1) }}%</span
            >
            <span class="sheet-label block">{{ t("common.victorias") }}</span>
          </span>
        </summary>
        <ul>
          <li
            v-for="match in row.matches"
            :key="match.date + match.homeScore + match.awayScore"
            class="grid grid-cols-[4.5rem_1fr_auto] items-center gap-x-3 border-t border-[var(--sheet-rule)] px-3 py-2.5"
          >
            <span class="sheet-num text-sm">{{ match.date }}</span>
            <span class="min-w-0">
              <span class="sheet-display sheet-num mr-2 text-2xl"
                >{{ match.homeScore }}–{{ match.awayScore }}</span
              >
              <span class="font-bold">{{
                match.result === "W"
                  ? t("common.victoria")
                  : match.result === "L"
                    ? t("common.derrota")
                    : t("common.empate")
              }}</span>
              <span
                v-if="match.tournament"
                class="block truncate text-sm text-[var(--sheet-ink-soft)]"
                >{{ match.tournament }}</span
              >
            </span>
            <NuxtLink
              :to="`/games/${match.slug}`"
              class="sheet-link inline-flex min-h-11 items-center text-sm"
              >{{ t("rivalsDetail.partido") }}</NuxtLink
            >
          </li>
        </ul>
      </details>
    </div>
  </div>
</template>
