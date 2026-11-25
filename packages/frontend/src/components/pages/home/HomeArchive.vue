<script setup lang="ts">
import { formatDate, type Game } from "@ministrosfc/shared";
import HomeArrow from "./HomeArrow.vue";

defineProps<{
  results: Game[];
  scorers: { player?: { id: string; firstName: string; lastName: string }; goalsScored: number }[];
  resultsLoading?: boolean;
  scorersLoading?: boolean;
}>();

function outcome(g: Game) {
  const h = g.homeTeamScore ?? 0;
  const a = g.awayTeamScore ?? 0;
  return h > a ? "Victoria" : h === a ? "Empate" : "Derrota";
}
</script>

<template>
  <div class="sheet-paper">
  <div class="mx-auto grid max-w-3xl gap-10 px-4 py-10 md:grid-cols-2">
    <section aria-labelledby="home-results">
      <h2 id="home-results" class="sheet-display text-4xl">Resultados</h2>
      <p v-if="resultsLoading" class="mt-4">Cargando…</p>
      <ul v-else-if="results.length" class="mt-3 border-t-[3px] border-[var(--sheet-ink)]">
        <li
          v-for="g in results"
          :key="g.id"
          class="border-b border-[var(--sheet-rule)]"
        >
          <NuxtLink
            :to="`/games/${g.slug || g.id}`"
            class="flex min-h-14 items-center gap-3 py-3 no-underline hover:bg-[var(--sheet-paper)]"
          >
            <span class="sheet-display sheet-num w-20 shrink-0 text-4xl">
              {{ g.homeTeamScore ?? 0 }}–{{ g.awayTeamScore ?? 0 }}
            </span>
            <span class="min-w-0 flex-1">
              <span class="block truncate font-bold">
                vs {{ g.opponentTeam?.name }}
              </span>
              <span class="sheet-num block text-sm text-[var(--sheet-ink-soft)]">
                {{ outcome(g) }} ·
                {{ formatDate(g.date, { day: "numeric", month: "short" }) }}
              </span>
            </span>
          </NuxtLink>
        </li>
      </ul>
      <p v-else class="mt-4">Todavía no hay partidos jugados.</p>
      <NuxtLink to="/schedule" class="sheet-link mt-3 inline-flex min-h-11 items-center gap-2"
        >Calendario completo <HomeArrow
      /></NuxtLink>
    </section>

    <section aria-labelledby="home-scorers">
      <h2 id="home-scorers" class="sheet-display text-4xl">Goleadores</h2>
      <p v-if="scorersLoading" class="mt-4">Cargando…</p>
      <ol v-else-if="scorers.length" class="mt-3 border-t-[3px] border-[var(--sheet-ink)]">
        <li
          v-for="(s, i) in scorers.slice(0, 5)"
          :key="s.player?.id ?? i"
          class="border-b border-[var(--sheet-rule)]"
        >
          <NuxtLink
            :to="`/players/${s.player?.id}`"
            class="flex min-h-12 items-center gap-3 py-2.5 no-underline hover:bg-[var(--sheet-paper)]"
          >
            <span class="sheet-num w-7 font-bold text-[var(--sheet-blue)]" aria-hidden="true">{{
              String(i + 1).padStart(2, "0")
            }}</span>
            <span class="min-w-0 flex-1 truncate font-bold"
              >{{ s.player?.firstName }} {{ s.player?.lastName }}</span
            >
            <span class="sheet-display sheet-num text-3xl"
              >{{ s.goalsScored }}<span class="sr-only"> goles</span></span
            >
          </NuxtLink>
        </li>
      </ol>
      <p v-else class="mt-4">Sin datos de goleadores.</p>
      <NuxtLink to="/statistics/top-scorers" class="sheet-link mt-3 inline-flex min-h-11 items-center gap-2"
        >Tabla completa <HomeArrow
      /></NuxtLink>
    </section>
  </div>
  </div>
</template>
