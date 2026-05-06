<script setup lang="ts">
import type { ColumnDef } from "~/types/table";
import { OPTION_FILTER_ALL, PlayerStatus } from "@ministrosfc/shared";
import YearSelect from "~/components/pages/statistics/StatsFilters/YearSelect.vue";
import TournamentSelect from "~/components/pages/statistics/StatsFilters/TournamentSelect.vue";
import { useAuthStore } from "~/stores/auth";

definePageMeta({ layout: "statistics", public: true });
useHead({ title: "Goleadores – Ministros FC" });

interface TopScorerEntry {
  player?: {
    id: string;
    firstName: string;
    lastName: string;
    nickname?: string | null;
    jerseyNumber?: number | null;
    position?: string | null;
    photoUrl?: string | null;
  };
  goalsScored: number;
  assists: number;
  appearances: number;
}

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

const { data, pending, refresh } = await useAsyncData(
  "top-scorers",
  () =>
    $api<{ data: TopScorerEntry[] }>("/api/v1/statistics/top-scorers", {
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

const allScorers = computed(() => data.value?.data ?? []);
const filteredScorers = computed(() => {
  if (!playerSearch.value.trim()) return allScorers.value;
  const q = playerSearch.value.trim().toLowerCase();
  const fullName = (e: TopScorerEntry) =>
    `${e.player?.firstName ?? ""} ${e.player?.lastName ?? ""}`.toLowerCase();
  return allScorers.value.filter((e) => fullName(e).includes(q));
});

watch(tournamentFilter, () => refresh());
watch(topScorersStatusFilter, () => refresh());
watch(yearFilter, () => refresh());

const columns: ColumnDef[] = [
  { key: "rank", label: "#", title: "Posición", sortable: false },
  { key: "name", label: "Jugador", title: "Jugador", sortable: true },
  { key: "goalsScored", label: "Goles", title: "Goles", sortable: true },
  { key: "assists", label: "Asist.", title: "Asistencias", sortable: true },
  {
    key: "appearances",
    label: "PJ",
    title: "Partidos Jugados",
    sortable: true,
  },
  {
    key: "goalRate",
    label: "Prom. Gol",
    title: "Promedio de gol",
    sortable: true,
  },
];

const tableRows = computed(() =>
  filteredScorers.value.map((entry, idx) => ({
    rank: idx + 1,
    name: `${entry.player?.firstName ?? ""} ${entry.player?.lastName ?? ""}`.trim(),
    goalsScored: entry.goalsScored,
    assists: entry.assists,
    appearances: entry.appearances,
    goalRate: entry.appearances > 0 ? entry.goalsScored / entry.appearances : 0,
    playerId: entry.player?.id ?? "",
  })),
);
</script>

<template>
  <div>
    <h1 class="text-xl font-bold text-gray-900 mb-4">Goleadores</h1>

    <!-- Filters -->
    <div class="flex flex-col sm:flex-row gap-3 mb-6">
      <input
        :value="playerSearch"
        @input="
          playerSearch = (
            ($event.target as HTMLInputElement).value || ''
          ).toString()
        "
        type="text"
        placeholder="Buscar jugador…"
        class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
      />
      <YearSelect v-model="yearFilter" />
      <TournamentSelect
        v-if="authStore.isAuthenticated"
        v-model="tournamentFilter"
      />
      <UiPlayerStatusSelect
        v-if="authStore.isAuthenticated"
        :model-value="topScorersStatusFilter"
        :include-all="false"
        @update:model-value="onTopScorersStatusUpdate"
      />
    </div>

    <!-- Table (loading and empty states handled internally by <UiStatsTable>) -->
    <UiStatsTable :columns="columns" :rows="tableRows" :loading="pending">
      <template #name-data="{ row }">
        <NuxtLink
          :to="`/players/${row.playerId}`"
          class="font-medium hover:text-brand transition-colors"
        >
          {{ row.name }}
        </NuxtLink>
      </template>
      <template #goalsScored-data="{ row }">
        <span class="font-bold text-brand">{{ row.goalsScored }}</span>
      </template>
      <template #goalRate-data="{ row }">
        {{ Number(row.goalRate).toFixed(2) }}
      </template>
    </UiStatsTable>
  </div>
</template>
