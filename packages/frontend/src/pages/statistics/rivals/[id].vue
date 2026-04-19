<script setup lang="ts">
import type { TeamStatPeriodDTO } from "@ministrosfc/shared";
import StatsFilters from "../../../components/pages/stats/StatsFilters.vue";
import StatsTitle from "~/components/pages/stats/StatsTitle.vue";

definePageMeta({
  layout: "statistics",
  public: true,
});

const route = useRoute();
const rivalId = route.params.id as string;
useHead({ title: "Estadísticas – Ministros FC" });

const { $api } = useNuxtApp();
const { filters, setFilter } = useStatsFilters();

const [{ data: teamData }, { data, pending, refresh }] = await Promise.all([
  useAsyncData(`rival-team-${rivalId}`, () =>
    $api<{ data: { name: string } }>(`/api/v1/teams/${rivalId}`),
  ),
  useAsyncData(
    `rival-stats-${rivalId}`,
    () =>
      $api<{ data: TeamStatPeriodDTO[] }>(
        `/api/v1/statistics/team/rivals/${rivalId}`,
        {
          query: {
            ...(filters.value.year ? { year: filters.value.year } : {}),
            ...(filters.value.playgroundId ? { playgroundId: filters.value.playgroundId } : {}),
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

const expandedYears = ref<string[]>(tableRows.value.map((r) => r.year));
watch(tableRows, (rows) => {
  rows.forEach((r) => {
    if (!expandedYears.value.includes(r.year)) expandedYears.value.push(r.year);
  });
});

function toggleYear(year: string) {
  const idx = expandedYears.value.indexOf(year);
  if (idx >= 0) expandedYears.value.splice(idx, 1);
  else expandedYears.value.push(year);
}

watch(
  () => route.query,
  () => refresh(),
);
</script>

<template>
  <div class="space-y-6">
    <NuxtLink
      to="/statistics/rivals"
      class="inline-flex items-center gap-1 w-24 text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      <svg
        class="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M15 19l-7-7 7-7"
        />
      </svg>
      Volver
    </NuxtLink>
    <StatsTitle>Estadísticas vs "{{ rivalName }}"</StatsTitle>
    <StatsFilters
      mode="rival"
      :year="filters.year"
      :playground="filters.playgroundId"
      @change:year="(v) => setFilter('year', v)"
      @change:playground="(v) => setFilter('playgroundId', v)"
    />

    <div v-if="pending" class="text-center text-muted-foreground py-8">
      Cargando...
    </div>
    <div
      v-else-if="tableRows.length === 0"
      class="text-center text-muted-foreground py-8"
    >
      Sin datos
    </div>
    <div v-else class="space-y-2">
      <UiAccordion
        v-for="row in tableRows"
        :key="row.year"
        :open="expandedYears.includes(row.year)"
        @toggle="toggleYear(row.year)"
      >
        <template #header>
          <div
            class="grid items-center gap-x-3 px-4 py-3 text-gray-900 w-full"
            style="
              grid-template-columns: 5.5rem 3rem 3rem 3rem 3rem 3rem 3rem 3rem 3.5rem;
            "
          >
            <span class="font-semibold text-sm">{{ row.year }}</span>
            <span class="text-sm"
              ><abbr title="Partidos Jugados">PJ</abbr> {{ row.games }}</span
            >
            <span class="text-sm text-green-600"
              ><abbr title="Partidos Ganados">PG</abbr> {{ row.wins }}</span
            >
            <span class="text-sm text-red-500"
              ><abbr title="Partidos Perdidos">PP</abbr> {{ row.losses }}</span
            >
            <span class="text-sm text-yellow-500"
              ><abbr title="Partidos Empatados">PE</abbr> {{ row.draws }}</span
            >
            <span class="text-sm"
              ><abbr title="Goles a Favor">GF</abbr> {{ row.goalsFor }}</span
            >
            <span class="text-sm"
              ><abbr title="Goles en Contra">GC</abbr>
              {{ row.goalsAgainst }}</span
            >
            <span
              class="text-sm"
              :class="
                row.goalDiff > 0
                  ? 'text-green-600'
                  : row.goalDiff < 0
                    ? 'text-red-500'
                    : ''
              "
            >
              <abbr title="Diferencia de gol">DG</abbr>
              {{ row.goalDiff > 0 ? "+" : "" }}{{ row.goalDiff }}
            </span>
            <span class="text-sm font-medium"
              >{{ Number(row.winRate).toFixed(1) }}%</span
            >
          </div>
        </template>

        <template #content>
          <ul class="divide-y">
            <li
              v-for="match in row.matches"
              :key="match.date + match.homeScore + match.awayScore"
              class="grid items-center gap-x-3 px-4 py-2 text-sm text-gray-900"
              style="
                grid-template-columns: 5.5rem 3rem 3rem 3rem 3rem 3rem 3rem 3rem 3.5rem auto;
              "
            >
              <span>{{ match.date }}</span>
              <span class="col-span-2 font-mono font-bold"
                >{{ match.homeScore }}–{{ match.awayScore }}</span
              >
              <span
                class="col-span-2"
                :class="{
                  'text-green-600 font-medium': match.result === 'W',
                  'text-red-500 font-medium': match.result === 'L',
                  'text-yellow-500 font-medium': match.result === 'D',
                }"
              >
                {{
                  match.result === "W"
                    ? "Victoria"
                    : match.result === "L"
                      ? "Derrota"
                      : "Empate"
                }}
              </span>
              <span class="col-span-4 text-xs text-muted-foreground truncate">{{
                match.tournament ?? ""
              }}</span>
              <NuxtLink
                :to="`/games/${match.slug}`"
                class="text-xs text-brand text-right hover:underline whitespace-nowrap"
                >Ir al partido</NuxtLink
              >
            </li>
          </ul>
        </template>
      </UiAccordion>
    </div>
  </div>
</template>
