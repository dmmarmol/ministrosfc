<script setup lang="ts">
import { computed } from "vue";
import type { PlayerRivalPeriodDTO } from "@ministrosfc/shared";
import StatsRanked, {
  type RankedItem,
  type RankedMetric,
} from "~/components/pages/statistics/StatsRanked.vue";

const props = defineProps<{ playerId: string }>();

const { $api } = useNuxtApp();

const { data: rivalsData, pending } = await useAsyncData(
  `player-rival-stats-${props.playerId}`,
  () =>
    $api<{ data: PlayerRivalPeriodDTO[] }>(
      `/api/v1/statistics/players/${props.playerId}/rivals`,
    ),
);

const rivals = computed(() => rivalsData.value?.data ?? []);

const pct = (v: number) => `${Math.round(v)}%`;
const signed = (v: number) => (v > 0 ? `+${v}` : String(v));
const metrics: RankedMetric[] = [
  { key: "games", label: "Partidos", unit: "partidos" },
  { key: "goals", label: "Goles", unit: "goles" },
  { key: "winRate", label: "% Victorias", unit: "% vict.", format: pct },
  { key: "goalDiff", label: "Dif. gol", unit: "dif. gol", format: signed },
];

const items = computed<RankedItem[]>(() =>
  rivals.value.map((r) => {
    const diff = r.goalsFor - r.goalsAgainst;
    return {
      id: r.rivalId,
      title: r.rivalName,
      cards: { yellow: r.yellowCards ?? 0, red: r.redCards ?? 0 },
      values: {
        games: r.gamesPlayed,
        goals: r.playerGoals,
        winRate: r.gamesPlayed ? (r.wins / r.gamesPlayed) * 100 : 0,
        goalDiff: diff,
      },
      detail: [
        { label: "PJ", value: r.gamesPlayed },
        { label: "PG", value: r.wins },
        { label: "PE", value: r.draws },
        { label: "PP", value: r.losses },
        { label: "GF", value: r.goalsFor },
        { label: "GC", value: r.goalsAgainst },
        { label: "G", value: r.playerGoals },
        { label: "A", value: r.playerAssists ?? 0 },
      ],
    };
  }),
);

const byId = computed(() => new Map(rivals.value.map((r) => [r.rivalId, r])));
const matchesOf = (id: string) => byId.value.get(id)?.matches ?? [];

const RESULT = {
  W: { label: "Victoria", tone: "text-[var(--sheet-win)]" },
  L: { label: "Derrota", tone: "text-[var(--sheet-loss)]" },
  D: { label: "Empate", tone: "text-[var(--sheet-draw)]" },
} as const;
</script>

<template>
  <div>
    <slot name="header"></slot>
    <p v-if="pending" class="mt-4">Cargando…</p>
    <StatsRanked
      v-else
      :items="items"
      :metrics="metrics"
      single
      search-label="Buscar equipo"
      empty-text="No hay partidos contra equipos rivales todavía."
    >
      <template #extra="{ item }">
        <div class="mt-3 border-t-[3px] border-[var(--sheet-ink)]">
          <!-- One grid for header and rows so the stat columns line up for comparison -->
          <div
            class="match-grid sheet-label border-b border-[var(--sheet-ink)] py-1.5 text-[0.6875rem]"
            aria-hidden="true"
          >
            <span>Partido</span>
            <span class="text-center" title="Goles">G</span>
            <span class="text-center" title="Asistencias">A</span>
            <span class="flex justify-center" title="Tarjetas amarillas"><span class="inline-block size-3 border border-[var(--sheet-ink)] bg-[var(--sheet-card-yellow)]" /></span>
            <span class="flex justify-center" title="Tarjetas rojas"><span class="inline-block size-3 border border-[var(--sheet-ink)] bg-[var(--sheet-card-red)]" /></span>
            <span class="match-link-head" />
          </div>
          <ul>
            <li
              v-for="m in matchesOf(item.id)"
              :key="m.slug ?? m.date + m.homeScore + m.awayScore"
              class="match-grid border-b border-[var(--sheet-rule)] py-2.5"
            >
              <span class="min-w-0">
                <span class="sheet-num block text-xs text-[var(--sheet-ink-soft)]">{{ m.date }}</span>
                <span class="sheet-display sheet-num mr-2 text-2xl">{{ m.homeScore }}–{{ m.awayScore }}</span>
                <span class="font-bold" :class="RESULT[m.result].tone">{{ RESULT[m.result].label }}</span>
                <span v-if="m.tournament" class="block truncate text-xs text-[var(--sheet-ink-soft)]">{{ m.tournament }}</span>
              </span>
              <span v-for="s in [
                { v: m.playerGoals, n: 'goles' },
                { v: m.playerAssists, n: 'asistencias' },
                { v: m.yellowCards, n: 'tarjetas amarillas' },
                { v: m.redCards, n: 'tarjetas rojas' },
              ]" :key="s.n" class="sheet-display sheet-num text-center text-2xl leading-none" :title="s.n" :class="s.v ? '' : 'text-[var(--sheet-rule)]'">
                {{ s.v || "–" }}<span class="sr-only"> {{ s.n }}</span>
              </span>
              <NuxtLink
                v-if="m.slug"
                :to="`/games/${m.slug}`"
                class="match-link sheet-link inline-flex min-h-11 items-center text-sm"
                >Ir al partido →</NuxtLink
              >
            </li>
          </ul>
        </div>
      </template>
    </StatsRanked>
  </div>
</template>

<style scoped>
/* Phone: result block + four stat columns, link on its own line.
   Wide: the link joins the row as a last column. */
.match-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) repeat(4, 2.5rem);
  align-items: center;
  column-gap: 0.25rem;
}
.match-link {
  grid-column: 1 / -1;
}
.match-link-head {
  display: none;
}
@media (min-width: 40rem) {
  .match-grid {
    grid-template-columns: minmax(0, 1fr) repeat(4, 3rem) 9rem;
  }
  .match-link {
    grid-column: auto;
    justify-self: end;
  }
  .match-link-head {
    display: block;
  }
}
</style>
