<script setup lang="ts">
import { PlayerStatus } from "@ministrosfc/shared";
import type { ColumnDef } from "~/types/table";

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
const route = useRoute();
const qp = useQueryParams();

const playerSearch = ref("");
const tournamentFilter = ref("");
const playerStatusFilter = ref<PlayerStatus | "">(
  (qp.get("playerStatus") as PlayerStatus) || PlayerStatus.ACTIVE,
);

const { data: tourData } = await useAsyncData("stats-tournaments", () =>
  $api<{ data: { id: string; name: string }[] }>("/api/v1/tournaments"),
);
const tournaments = computed(() => tourData.value?.data ?? []);

const { data, pending, refresh } = await useAsyncData(
  "top-scorers",
  () =>
    $api<{ data: TopScorerEntry[] }>("/api/v1/statistics/top-scorers", {
      query: {
        limit: 50,
        ...(tournamentFilter.value
          ? { tournamentId: tournamentFilter.value }
          : {}),
        ...(playerStatusFilter.value
          ? { status: playerStatusFilter.value }
          : {}),
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
watch(playerStatusFilter, (v) => qp.set("playerStatus", v));
watch(
  () => route.query.playerStatus,
  () => {
    playerStatusFilter.value =
      (qp.get("playerStatus") as PlayerStatus) || PlayerStatus.ACTIVE;
    refresh();
  },
);

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
        v-model="playerSearch"
        type="text"
        placeholder="Buscar jugador…"
        class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
      />
      <select
        v-model="tournamentFilter"
        class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
      >
        <option value="">Todos los torneos</option>
        <option v-for="t in tournaments" :key="t.id" :value="t.id">
          {{ t.name }}
        </option>
      </select>
      <select
        v-model="playerStatusFilter"
        class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
      >
        <option :value="PlayerStatus.ACTIVE">Activos</option>
        <option :value="PlayerStatus.INACTIVE">Inactivos</option>
        <option value="">Todos los estados</option>
      </select>
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
