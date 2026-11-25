<script setup lang="ts">
import type {
  ApiResponse,
  Game,
  TournamentStatsResponse,
} from "@ministrosfc/shared";
import { formatCompetitionType, formatDateRange } from "~/utils/stats";
import GameLine from "~/components/pages/schedule/GameLine.vue";
import StatsRanked, {
  type RankedItem,
  type RankedMetric,
} from "~/components/pages/statistics/StatsRanked.vue";


const { t } = useI18n();
definePageMeta({ public: true, layout: "sheet" });

const { $api } = useNuxtApp();
const route = useRoute();
const id = route.params.id as string;

const { data: statsData, pending } = await useAsyncData(`tournament-${id}`, () =>
  $api<ApiResponse<TournamentStatsResponse>>(`/api/v1/statistics/tournaments/${id}`).catch(() => null),
);
const { data: gamesData } = await useAsyncData(`tournament-games-${id}`, () =>
  $api<{ data: Game[] }>("/api/v1/games", {
    query: { tournamentId: id, limit: 100 },
  })
    .then((r) => r.data ?? [])
    .catch(() => [] as Game[]),
);

const tournament = computed(() => statsData.value?.data?.tournament ?? null);
const record = computed(() => statsData.value?.data?.ministrosRecord ?? null);
const games = computed(() =>
  [...(gamesData.value ?? [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  ),
);

// Game lines show weekday and day only, so group them under their month
const gameGroups = computed(() => {
  const out: { key: string; label: string; items: Game[] }[] = [];
  for (const g of games.value) {
    const d = new Date(g.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    let grp = out.find((x) => x.key === key);
    if (!grp) {
      const label = d.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
      out.push((grp = { key, label: label.charAt(0).toUpperCase() + label.slice(1), items: [] }));
    }
    grp.items.push(g);
  }
  return out;
});

useHead(() => ({ title: tournament.value?.name ?? t("common.torneo") }));

const signed = (v: number) => (v > 0 ? `+${v}` : String(v));
const totals = computed(() => {
  const r = record.value;
  if (!r) return [];
  return [
    { label: t("common.partidos"), value: r.played },
    { label: t("common.victorias"), value: r.wins },
    { label: t("common.empates"), value: r.draws },
    { label: t("common.derrotas"), value: r.losses },
    { label: t("common.golesAFavor"), value: r.goalsFor },
    { label: t("common.golesEnContra"), value: r.goalsAgainst },
    { label: t("common.difGol"), value: signed(r.goalDifference) },
  ];
});

const metrics: RankedMetric[] = [
  { key: "goals", label: t("common.goles"), unit: t("units.goles") },
  { key: "assists", label: t("common.asist"), unit: t("units.asist") },
  { key: "games", label: t("common.partidos"), unit: t("units.partidos") },
];
const scorers = computed<RankedItem[]>(() =>
  (statsData.value?.data?.playerStats ?? [])
    .filter((s) => s.player && (s.goalsScored > 0 || s.assists > 0))
    .map((s) => ({
      id: s.player!.id,
      title: s.player!.lastName,
      subtitle: s.player!.firstName,
      to: `/players/${s.player!.id}`,
      linkLabel: `Ver ficha de ${s.player!.firstName}`,
      cards: { yellow: s.yellowCards, red: s.redCards },
      values: { goals: s.goalsScored, assists: s.assists, games: s.appearances },
      detail: [
        { label: "PJ", value: s.appearances },
        { label: t("common.goles"), value: s.goalsScored },
        { label: t("common.asist"), value: s.assists },
        { label: t("common.amar"), value: s.yellowCards },
      ],
    })),
);
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 pb-12 pt-6">
    <UiBackButton to="/tournaments" :label="t('tournamentsDetail.torneos')" />

    <UiSheetMessage v-if="pending" class="mt-6">{{ t("tournamentsDetail.cargandoTorneo") }}</UiSheetMessage>
    <template v-else-if="tournament">
      <UiSheetTitle size="md" class="mt-2">{{ tournament.name }}</UiSheetTitle>
      <p class="sheet-label mt-3">
        {{ formatCompetitionType(tournament.competitionType) }} ·
        {{ formatDateRange(tournament.startDate, tournament.endDate) }}
      </p>
      <p v-if="tournament.description" class="mt-3 max-w-prose">{{ tournament.description }}</p>

      <UiSheetTotals v-if="record && record.played" :items="totals" class="mt-6" />

      <section class="mt-10" aria-labelledby="t-games">
        <UiSheetBand id="t-games" :count="games.length" count-label="partidos">{{ t("common.partidos") }}</UiSheetBand>
        <template v-if="games.length">
          <div v-for="grp in gameGroups" :key="grp.key" class="mt-5">
            <h3 class="sheet-display text-2xl">{{ grp.label }}</h3>
            <ul class="mt-1 border-t-[3px] border-[var(--sheet-ink)] bg-[var(--sheet-paper)]">
              <li
                v-for="g in grp.items"
                :key="g.id"
                class="border-b border-[var(--sheet-rule)] px-3"
              >
                <GameLine :game="g" />
              </li>
            </ul>
          </div>
        </template>
        <p v-else class="border-b-[3px] border-[var(--sheet-ink)] bg-[var(--sheet-paper)] px-3 py-4">
          {{ t("tournamentsDetail.todaviaNoHayPartidos") }}
        </p>
      </section>

      <section class="mt-10" aria-labelledby="t-scorers">
        <UiSheetBand id="t-scorers">{{ t("common.goleadores") }}</UiSheetBand>
        <StatsRanked
          :items="scorers"
          :metrics="metrics"
          :empty-text="t('tournamentsDetail.todaviaNoHayGoles')"
        />
      </section>
    </template>
    <UiSheetMessage v-else tone="empty" class="mt-8">{{ t("errors.noSeEncontroElTorneo") }}</UiSheetMessage>
  </div>
</template>
