<script setup lang="ts">
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

const playerSearch = ref("");
const tournamentFilter = ref("");

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
    </div>

    <!-- Loading -->
    <div v-if="pending" class="space-y-2">
      <div
        v-for="i in 10"
        :key="i"
        class="h-12 bg-gray-200 animate-pulse rounded"
      />
    </div>

    <!-- Table -->
    <div
      v-else-if="filteredScorers.length"
      class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
    >
      <table class="w-full text-sm text-gray-900">
        <thead class="bg-gray-50 text-gray-900 uppercase text-xs">
          <tr>
            <th class="px-4 py-3 text-left">#</th>
            <th class="px-4 py-3 text-left">Jugador</th>
            <th class="px-4 py-3 text-right">Goles</th>
            <th class="px-4 py-3 text-right">Asistencias</th>
            <th class="px-4 py-3 text-right">Partidos</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(entry, idx) in filteredScorers"
            :key="entry.player?.id"
            class="border-t border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <td class="px-4 py-3 text-gray-400 font-bold">{{ idx + 1 }}</td>
            <td class="px-4 py-3 font-medium">
              <NuxtLink
                :to="`/players/${entry.player?.id}`"
                class="hover:text-brand transition-colors"
              >
                {{ entry.player?.firstName }} {{ entry.player?.lastName }}
              </NuxtLink>
            </td>
            <td class="px-4 py-3 text-right font-bold text-brand">
              {{ entry.goalsScored }}
            </td>
            <td class="px-4 py-3 text-right text-gray-600">
              {{ entry.assists }}
            </td>
            <td class="px-4 py-3 text-right text-gray-600">
              {{ entry.appearances }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="text-center py-16 text-gray-500">
      Sin estadísticas disponibles.
    </div>
  </div>
</template>
