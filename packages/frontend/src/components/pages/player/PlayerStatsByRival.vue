<script setup lang="ts">
import type { PlayerRivalPeriodDTO } from "@ministrosfc/shared";

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

// Derive select options directly from the rival data — always in sync
const teamsWithData = computed(() =>
  rivals.value.map((r) => ({ id: r.rivalId, name: r.rivalName })),
);

const selectedRivalId = ref<string>("");

const filteredRivals = computed(() => {
  if (!selectedRivalId.value) return [];
  return rivals.value.filter((r) => r.rivalId === selectedRivalId.value);
});

const expandedRivals = ref<string[]>([]);

watch(filteredRivals, (rows) => {
  rows.forEach((r) => {
    if (!expandedRivals.value.includes(r.rivalId))
      expandedRivals.value.push(r.rivalId);
  });
});

function toggleRival(rivalId: string) {
  const idx = expandedRivals.value.indexOf(rivalId);
  if (idx >= 0) expandedRivals.value.splice(idx, 1);
  else expandedRivals.value.push(rivalId);
}
</script>

<template>
  <div class="space-y-4">
    <!-- Team filter -->
    <div class="flex flex-col gap-1">
      <label for="rival-team-select" class="text-sm font-medium text-gray-700">
        Equipo
      </label>
      <select
        id="rival-team-select"
        v-model="selectedRivalId"
        class="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand max-w-xs"
      >
        <option value="">Selecciona un equipo</option>
        <option v-for="team in teamsWithData" :key="team.id" :value="team.id">
          {{ team.name }}
        </option>
      </select>
    </div>

    <div v-if="pending" class="text-center text-muted-foreground py-8">
      Cargando...
    </div>
    <template v-else-if="selectedRivalId">
      <div
        v-if="filteredRivals.length === 0"
        class="text-center text-muted-foreground py-8"
      >
        Sin datos para este equipo.
      </div>
      <div v-else class="space-y-2">
        <UiAccordion
          v-for="row in filteredRivals"
          :key="row.rivalId"
          :open="expandedRivals.includes(row.rivalId)"
          @toggle="toggleRival(row.rivalId)"
        >
          <template #header>
            <div class="overflow-x-auto w-full">
              <div
                class="grid items-center gap-x-3 px-4 py-3 text-gray-900 min-w-max"
                style="
                  grid-template-columns: 9rem 3rem 3rem 3rem 3rem 3rem 3rem 3rem 4rem;
                "
              >
                <span class="font-semibold text-sm truncate">{{
                  row.rivalName
                }}</span>
                <span class="text-sm"
                  ><abbr title="Partidos Jugados">PJ</abbr>
                  {{ row.gamesPlayed }}</span
                >
                <span class="text-sm text-green-600"
                  ><abbr title="Partidos Ganados">PG</abbr> {{ row.wins }}</span
                >
                <span class="text-sm text-red-500"
                  ><abbr title="Partidos Perdidos">PP</abbr>
                  {{ row.losses }}</span
                >
                <span class="text-sm text-yellow-500"
                  ><abbr title="Partidos Empatados">PE</abbr>
                  {{ row.draws }}</span
                >
                <span class="text-sm"
                  ><abbr title="Goles a Favor">GF</abbr>
                  {{ row.goalsFor }}</span
                >
                <span class="text-sm"
                  ><abbr title="Goles en Contra">GC</abbr>
                  {{ row.goalsAgainst }}</span
                >
                <span class="text-sm font-medium text-brand"
                  ><abbr title="Goles del Jugador">G</abbr>
                  {{ row.playerGoals }}</span
                >
                <span
                  class="text-sm"
                  :class="
                    row.goalsFor - row.goalsAgainst > 0
                      ? 'text-green-600'
                      : row.goalsFor - row.goalsAgainst < 0
                        ? 'text-red-500'
                        : ''
                  "
                >
                  <abbr title="Diferencia de Gol">DG</abbr>
                  {{ row.goalsFor - row.goalsAgainst > 0 ? "+" : ""
                  }}{{ row.goalsFor - row.goalsAgainst }}
                </span>
              </div>
            </div>
          </template>

          <template #content>
            <div class="overflow-x-auto">
              <ul class="divide-y min-w-max">
                <li
                  v-for="match in row.matches"
                  :key="match.date + match.homeScore + match.awayScore"
                  class="grid items-center gap-x-3 px-4 py-2 text-sm text-gray-900"
                  style="grid-template-columns: 6rem 3.5rem 5rem 1fr 4rem auto"
                >
                  <span>{{ match.date }}</span>
                  <span class="font-mono font-bold"
                    >{{ match.homeScore }}–{{ match.awayScore }}</span
                  >
                  <span
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
                  <span class="text-xs text-muted-foreground truncate">{{
                    match.tournament ?? ""
                  }}</span>
                  <span
                    class="text-sm font-medium text-brand whitespace-nowrap"
                  >
                    ⚽ {{ match.playerGoals }}
                  </span>
                  <NuxtLink
                    :to="`/games/${match.slug}`"
                    class="text-xs text-brand text-right hover:underline whitespace-nowrap"
                  >
                    Ir al partido
                  </NuxtLink>
                </li>
              </ul>
            </div>
          </template>
        </UiAccordion>
      </div>
    </template>
  </div>
</template>
