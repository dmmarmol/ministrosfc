<script setup lang="ts">
import StatsField from "~/components/pages/statistics/StatsField.vue";
import type { ApiResponse, TeamStatPeriodDTO } from "@ministrosfc/shared";
import StatsTitle from "~/components/pages/statistics/StatsTitle.vue";
import YearSelect from "~/components/pages/statistics/StatsFilters/YearSelect.vue";
import StatsFilterBar from "~/components/pages/statistics/StatsFilterBar.vue";
import PlaygroundSelect from "~/components/pages/admin/playground/PlaygroundSelect.vue";
import { useStatsFilters } from "~/composables/useStatsFilters";

definePageMeta({
  layout: "statistics",
  public: true,
});

const route = useRoute();
const rivalId = route.params.id as string;
useHead({ title: "Estadísticas por rival" });

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

const plural = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`;

watch(
  () => route.query,
  () => refresh(),
);
</script>

<template>
  <div>
    <NuxtLink
      to="/statistics/rivals"
      class="sheet-link inline-flex min-h-11 items-center"
      >← Rivales</NuxtLink
    >
    <StatsTitle>vs {{ rivalName }}</StatsTitle>
    <StatsFilterBar>
      <StatsField label="Año"><YearSelect v-model="yearFilter" /></StatsField>
      <StatsField label="Cancha"><PlaygroundSelect v-model="playgroundFilter" placeholder="Todas" /></StatsField>
    </StatsFilterBar>

    <p v-if="pending" class="mt-6">Cargando…</p>
    <p v-else-if="tableRows.length === 0" class="mt-6">
      No hay partidos contra este rival para estos filtros.
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
              <span class="whitespace-nowrap">{{ plural(row.games, "partido", "partidos") }}</span>
              <span class="whitespace-nowrap">{{ plural(row.wins, "ganado", "ganados") }}</span>
              <span class="whitespace-nowrap">{{ plural(row.draws, "empatado", "empatados") }}</span>
              <span class="whitespace-nowrap">{{ plural(row.losses, "perdido", "perdidos") }}</span>
            </span>
            <span class="sheet-num block text-sm text-[var(--sheet-ink-soft)]">
              {{ row.goalsFor }} goles a favor, {{ row.goalsAgainst }} en contra
            </span>
          </span>
          <span class="text-right">
            <span class="sheet-display sheet-num block text-4xl leading-none"
              >{{ Number(row.winRate).toFixed(1) }}%</span
            >
            <span class="sheet-label block">victorias</span>
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
                  ? "Victoria"
                  : match.result === "L"
                    ? "Derrota"
                    : "Empate"
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
              >Partido →</NuxtLink
            >
          </li>
        </ul>
      </details>
    </div>
  </div>
</template>
