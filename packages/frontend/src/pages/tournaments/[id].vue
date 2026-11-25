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

useHead(() => ({ title: tournament.value?.name ?? "Torneo" }));

const signed = (v: number) => (v > 0 ? `+${v}` : String(v));
const totals = computed(() => {
  const r = record.value;
  if (!r) return [];
  return [
    { label: "Partidos", value: r.played },
    { label: "Victorias", value: r.wins },
    { label: "Empates", value: r.draws },
    { label: "Derrotas", value: r.losses },
    { label: "Goles a favor", value: r.goalsFor },
    { label: "Goles en contra", value: r.goalsAgainst },
    { label: "Dif. gol", value: signed(r.goalDifference) },
  ];
});

const metrics: RankedMetric[] = [
  { key: "goals", label: "Goles", unit: "goles" },
  { key: "assists", label: "Asist.", unit: "asist." },
  { key: "games", label: "Partidos", unit: "partidos" },
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
        { label: "Goles", value: s.goalsScored },
        { label: "Asist.", value: s.assists },
        { label: "Amar.", value: s.yellowCards },
      ],
    })),
);
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 pb-12 pt-6">
    <NuxtLink to="/tournaments" class="sheet-link inline-flex min-h-11 items-center"
      >← Torneos</NuxtLink
    >

    <p v-if="pending" class="mt-6">Cargando torneo…</p>
    <template v-else-if="tournament">
      <h1 class="sheet-display mt-2 text-[clamp(2.75rem,12vw,5rem)]">{{ tournament.name }}</h1>
      <p class="sheet-label mt-3">
        {{ formatCompetitionType(tournament.competitionType) }} ·
        {{ formatDateRange(tournament.startDate, tournament.endDate) }}
      </p>
      <p v-if="tournament.description" class="mt-3 max-w-prose">{{ tournament.description }}</p>

      <dl
        v-if="record && record.played"
        class="mt-6 grid grid-cols-2 border-y-[3px] border-[var(--sheet-ink)] sm:grid-cols-4"
      >
        <div
          v-for="t in totals"
          :key="t.label"
          class="border-b border-r border-[var(--sheet-rule)] px-3 py-3 [&:last-child:nth-child(odd)]:col-span-2 sm:[&:last-child:nth-child(odd)]:col-span-1"
        >
          <dt class="sheet-label">{{ t.label }}</dt>
          <dd class="sheet-display sheet-num mt-1 text-5xl">{{ t.value }}</dd>
        </div>
      </dl>

      <section class="mt-10" aria-labelledby="t-games">
        <h2
          id="t-games"
          class="sheet-on-ink sheet-display flex items-baseline justify-between bg-[var(--sheet-ink)] px-3 py-2 text-4xl text-[var(--sheet-paper)]"
        >
          Partidos
          <span class="sheet-num font-[var(--sheet-type)] text-base font-bold text-[var(--sheet-blue-on-ink)]"
            >{{ games.length }}<span class="sr-only"> partidos</span></span
          >
        </h2>
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
          Todavía no hay partidos en este torneo.
        </p>
      </section>

      <section class="mt-10" aria-labelledby="t-scorers">
        <h2
          id="t-scorers"
          class="sheet-on-ink sheet-display flex items-baseline justify-between bg-[var(--sheet-ink)] px-3 py-2 text-4xl text-[var(--sheet-paper)]"
        >
          Goleadores
        </h2>
        <StatsRanked
          :items="scorers"
          :metrics="metrics"
          empty-text="Todavía no hay goles registrados en este torneo."
        />
      </section>
    </template>
    <p v-else class="mt-8 text-lg">No se encontró el torneo.</p>
  </div>
</template>
