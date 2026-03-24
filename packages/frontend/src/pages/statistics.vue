<template>
  <div>
    <useHead><title>Statistics – Ministros FC</title></useHead>
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

    <!-- Top scorers table -->
    <div v-if="pending" class="space-y-2">
      <div
        v-for="i in 10"
        :key="i"
        class="h-12 bg-gray-200 animate-pulse rounded"
      />
    </div>
    <div
      v-else-if="filteredScorers.length"
      class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
    >
      <table class="w-full text-sm">
        <thead class="bg-gray-50 text-gray-600 uppercase text-xs">
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
            :key="entry.playerId"
            class="border-t border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <td class="px-4 py-3 text-gray-400 font-bold">{{ idx + 1 }}</td>
            <td class="px-4 py-3 font-medium">
              <NuxtLink
                :to="`/players/${entry.playerId}`"
                class="hover:text-brand transition-colors"
                >{{ entry.playerName }}</NuxtLink
              >
            </td>
            <td class="px-4 py-3 text-right font-bold text-brand">
              {{ entry.goals }}
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

<script setup lang="ts">
useHead({ title: "Statistics – Ministros FC" });

const { $api } = useNuxtApp();
const playerSearch = ref("");
const tournamentFilter = ref("");

const { data: tourData } = await useAsyncData("stats-tournaments", () =>
  $api<{ data: any[] }>("/api/v1/tournaments"),
);
const tournaments = computed(() => tourData.value?.data ?? []);

const { data, pending, refresh } = await useAsyncData("top-scorers", () =>
  $api<{ data: any[] }>("/api/v1/statistics/top-scorers", {
    query: {
      limit: 50,
      ...(tournamentFilter.value
        ? { tournamentId: tournamentFilter.value }
        : {}),
    },
  }),
);
watch(tournamentFilter, () => refresh());

const allScorers = computed(() => data.value?.data ?? []);
const filteredScorers = computed(() => {
  if (!playerSearch.value.trim()) return allScorers.value;
  const q = playerSearch.value.trim().toLowerCase();
  return allScorers.value.filter((e: any) =>
    e.playerName?.toLowerCase().includes(q),
  );
});
</script>
