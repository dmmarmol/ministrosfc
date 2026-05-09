<script setup lang="ts">
import { NuxtLink, UButton } from "#components";
import type { ColumnDef } from "~/types/table";
import { OPTION_FILTER_ALL, PlayerStatus } from "@ministrosfc/shared";
import type { TopScorerDTO } from "@ministrosfc/shared";
import YearSelect from "~/components/pages/statistics/StatsFilters/YearSelect.vue";
import TournamentSelect from "~/components/pages/statistics/StatsFilters/TournamentSelect.vue";
import { useAuthStore } from "~/stores/auth";
import { getSortedIcon } from "~/components/ui/Table/table-utils";

/**
 * Exclusive DTO to match the UTable Schema
 */
type TopScorerRow = Omit<TopScorerDTO, "player"> & {
  name: string;
  playerId: string;
  rank: number;
  goalRate: number;
};

definePageMeta({ layout: "statistics", public: true });
useHead({ title: "Goleadores – Ministros FC" });

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
    $api<{ data: TopScorerDTO[] }>("/api/v1/statistics/top-scorers", {
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
  const fullName = (e: TopScorerDTO) =>
    `${e.player?.firstName ?? ""} ${e.player?.lastName ?? ""}`.toLowerCase();
  return allScorers.value.filter((e) => fullName(e).includes(q));
});

watch(tournamentFilter, () => refresh());
watch(topScorersStatusFilter, () => refresh());
watch(yearFilter, () => refresh());

const columns: ColumnDef<TopScorerRow>[] = [
  { accessorKey: "rank", header: "#", title: "Ranking", sortable: false },
  {
    accessorKey: "position",
    header: "Pos",
    meta: {
      class: {
        th: "w-16 text-center",
      },
    },
    cell: ({ row }) =>
      h(resolveComponent("UiPositionLabel"), {
        position: row.getValue("position"),
      }),
  },
  {
    accessorKey: "name",
    title: "Jugador",
    sortable: true,
    header: "Jugador",
    cell({ row }) {
      const data = row.original as TopScorerRow;
      const playerId = data.playerId;
      const value = data.name;

      return playerId
        ? h(
            NuxtLink,
            {
              class: "font-medium hover:text-brand transition-colors",
              to: `/players/${playerId}`,
            },
            () => value,
          )
        : h("span", {}, () => value);
    },
  },
  {
    accessorKey: "goalsScored",
    title: "Goles",
    sortable: true,
    header: ({ column }) => {
      return h(UButton, {
        variant: "ghost",
        color: "neutral",
        label: "Goles",
        icon: getSortedIcon(column.getIsSorted() || null),
        onClick: () => column.toggleSorting(),
      });
    },
  },
  {
    accessorKey: "assists",
    title: "Asistencias",
    sortable: true,
    header: ({ column }) => {
      return h(UButton, {
        variant: "ghost",
        color: "neutral",
        label: "Asist.",
        icon: getSortedIcon(column.getIsSorted() || null),
        onClick: () => column.toggleSorting(),
      });
    },
  },
  {
    accessorKey: "appearances",
    title: "Partidos Jugados",
    sortable: true,
    header: ({ column }) => {
      return h(UButton, {
        variant: "ghost",
        color: "neutral",
        label: "PJ",
        icon: getSortedIcon(column.getIsSorted() || null),
        onClick: () => column.toggleSorting(),
      });
    },
  },
  {
    accessorKey: "goalRate",
    title: "Promedio de gol",
    sortable: true,
    cell({ row }) {
      return h("span", {}, row.getValue("goalRate").toFixed(2) + "%");
    },
    header: ({ column }) => {
      return h(UButton, {
        variant: "ghost",
        color: "neutral",
        label: "Prom. Gol",
        icon: getSortedIcon(column.getIsSorted() || null),
        onClick: () => column.toggleSorting(),
      });
    },
  },
];

const tableRows = computed((): TopScorerRow[] =>
  filteredScorers.value.map((entry, idx) => ({
    playerId: entry.player?.id ?? "",
    rank: idx + 1,
    position: entry.player?.position ?? "",
    name: `${entry.player?.firstName ?? ""} ${entry.player?.lastName ?? ""}`.trim(),
    goalsScored: entry.goalsScored,
    assists: entry.assists,
    appearances: entry.appearances,
    goalRate: entry.appearances > 0 ? entry.goalsScored / entry.appearances : 0,
  })),
);

const sorting = ref<{ id: keyof TopScorerDTO; desc: boolean }[]>([
  {
    id: "goalsScored",
    desc: true,
  },
]);
</script>

<template>
  <div>
    <h1 class="text-xl font-bold text-gray-900 mb-4">Goleadores</h1>

    <!-- Filters -->
    <div class="flex gap-3 mb-6">
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
      <YearSelect v-model="yearFilter" class="w-1/6" />
      <TournamentSelect
        v-if="authStore.isAuthenticated"
        v-model="tournamentFilter"
        class="w-1/6"
      />
      <UiPlayerStatusSelect
        v-if="authStore.isAuthenticated"
        include-all
        v-model="topScorersStatusFilter"
        class="w-1/6"
      />
    </div>

    <UTable v-model:sorting="sorting" :data="tableRows" :columns="columns" />
  </div>
</template>
