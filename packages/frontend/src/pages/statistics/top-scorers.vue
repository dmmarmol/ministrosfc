<script setup lang="ts">
import StatsField from "~/components/pages/statistics/StatsField.vue";
import { OPTION_FILTER_ALL, PlayerStatus } from "@ministrosfc/shared";
import type { TopScorerDTO, Position, ApiResponse } from "@ministrosfc/shared";
import StatsRanked, { type RankedItem, type RankedMetric } from "~/components/pages/statistics/StatsRanked.vue";
import StatsTitle from "~/components/pages/statistics/StatsTitle.vue";
import StatsFilterBar from "~/components/pages/statistics/StatsFilterBar.vue";
import YearSelect from "~/components/pages/statistics/StatsFilters/YearSelect.vue";
import TournamentSelect from "~/components/pages/statistics/StatsFilters/TournamentSelect.vue";
import { useAuthStore } from "~/stores/auth";
import { useStatsFilters } from "~/composables/useStatsFilters";


const { t } = useI18n();
definePageMeta({ layout: "statistics", public: true });
useHead({ title: t("common.goleadores") });

const { $api } = useNuxtApp();
const authStore = useAuthStore();
const {
  playerStatus: playerStatusFilter,
  tournament: tournamentFilter,
  year: yearFilter,
} = useStatsFilters();

const topScorersStatusFilter = ref<PlayerStatus>(PlayerStatus.ACTIVE);

function onTopScorersStatusUpdate(
  value: PlayerStatus | typeof OPTION_FILTER_ALL,
) {
  topScorersStatusFilter.value =
    value && value !== OPTION_FILTER_ALL ? value : PlayerStatus.ACTIVE;
}

watchEffect(() => {
  const value = playerStatusFilter.value;
  topScorersStatusFilter.value =
    value && value !== OPTION_FILTER_ALL
      ? (value as PlayerStatus)
      : PlayerStatus.ACTIVE;
});

watch(topScorersStatusFilter, (value) => {
  playerStatusFilter.value = value;
});

const playerSearch = ref("");

const { data, status, refresh } = await useAsyncData(
  "top-scorers",
  () =>
    $api<ApiResponse<TopScorerDTO[]>>("/api/v1/statistics/top-scorers", {
      query: {
        limit: 50,
        ...(yearFilter.value ? { year: yearFilter.value } : {}),
        ...(tournamentFilter.value
          ? { tournamentName: tournamentFilter.value }
          : {}),
        status: topScorersStatusFilter.value,
      },
    }),
  { server: false },
);

// The fetch is client-only, so the server reports "idle" and the client "pending"
// while hydrating. Both must render the same loading state or Vue warns of a mismatch.
const loading = computed(
  () => status.value === "idle" || status.value === "pending",
);

const allScorers = computed(() => data.value?.data ?? []);
const filteredScorers = computed(() => {
  if (!playerSearch.value.trim()) return allScorers.value;
  const q = playerSearch.value.trim().toLowerCase();
  const fullName = (e: TopScorerDTO) =>
    `${e.player?.firstName ?? ""} ${e.player?.lastName ?? ""}`.toLowerCase();
  return allScorers.value.filter((e) => fullName(e).includes(q));
});

watch(tournamentFilter, () => refresh());
watch(topScorersStatusFilter, () => refresh());
watch(yearFilter, () => refresh());

const metrics: RankedMetric[] = [
  { key: "goals", label: t("common.goles"), unit: t("units.goles") },
  { key: "assists", label: t("common.asist"), unit: t("units.asist") },
  { key: "games", label: t("common.partidos"), unit: t("units.partidos") },
  {
    key: "rate",
    label: t("statisticsTopscorers.promGol"),
    unit: t("statisticsTopscorers.golesPartido"),
    format: (v: number) => v.toFixed(2),
  },
];

const items = computed<RankedItem[]>(() =>
  filteredScorers.value.map((e, i) => {
    const name = `${e.player?.firstName ?? ""} ${e.player?.lastName ?? ""}`.trim();
    const rate = e.appearances > 0 ? e.goalsScored / e.appearances : 0;
    return {
      id: e.player?.id ?? `row-${i}`,
      title: e.player?.lastName || name,
      subtitle: e.player?.firstName,
      position: e.player?.position ?? null,
      to: e.player?.id ? `/players/${e.player.id}` : undefined,
      linkLabel: `Ver ficha de ${e.player?.firstName ?? "jugador"}`,
      values: { goals: e.goalsScored, assists: e.assists, games: e.appearances, rate },
      detail: [
        { label: "PJ", value: e.appearances },
        { label: t("common.goles"), value: e.goalsScored },
        { label: t("common.asist"), value: e.assists },
        { label: "G/PJ", value: rate.toFixed(2) },
      ],
    };
  }),
);
</script>

<template>
  <div>
    <StatsTitle>{{ t("common.goleadores") }}</StatsTitle>
    <StatsFilterBar>
      <label class="col-span-full block lg:col-span-1">
        <span class="sheet-label">{{ t("statisticsTopscorers.buscarJugador") }}</span>
        <input
          :value="playerSearch"
          type="search"
          :placeholder="t('common.nombre')"
          class="sheet-field mt-1"
          @input="playerSearch = (($event.target as HTMLInputElement).value || '').toString()"
        />
      </label>
      <StatsField :label="t('common.ano')"><YearSelect v-model="yearFilter" /></StatsField>
      <StatsField :label="t('common.torneo')" v-if="authStore.isAuthenticated"><TournamentSelect v-model="tournamentFilter" /></StatsField>
      <StatsField :label="t('common.estado')" v-if="authStore.isAuthenticated"><UiPlayerStatusSelect
        include-all
        v-model="topScorersStatusFilter"
      /></StatsField>
    </StatsFilterBar>
    <StatsRanked :items="items" :metrics="metrics" :loading="loading" />
  </div>
</template>
