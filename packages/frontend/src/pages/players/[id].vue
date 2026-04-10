<script setup lang="ts">
definePageMeta({ public: true });
const { $api } = useNuxtApp();
const route = useRoute();
const id = route.params.id as string;

const [{ data: playerData, pending }, { data: statsData }] = await Promise.all([
  useAsyncData(`player-${id}`, () =>
    $api<{ data: any }>(`/api/v1/players/${id}`),
  ),
  useAsyncData(`player-stats-${id}`, () =>
    $api<{ data: any }>(`/api/v1/statistics/players/${id}`),
  ),
]);
const player = computed(() => playerData.value?.data ?? null);
const stats = computed(() => statsData.value?.data ?? null);
const tournamentStats = computed(() => stats.value?.byTournament ?? []);

const statCards = computed(() => {
  const s = stats.value ?? {};
  return [
    { label: "Goals", value: s.goals ?? 0 },
    { label: "Assists", value: s.assists ?? 0 },
    { label: "Appearances", value: s.appearances ?? 0 },
    { label: "Yellow Cards", value: s.yellowCards ?? 0 },
  ];
});

useHead(() => ({
  title: player.value
    ? `${player.value.firstName} ${player.value.lastName} – Ministros FC`
    : "Player",
}));
</script>

<template>
  <div>
    <div v-if="pending" class="space-y-4">
      <div class="h-64 bg-gray-200 animate-pulse rounded-2xl" />
    </div>
    <template v-else-if="player">
      <!-- Profile header -->
      <div
        class="bg-gray-900 text-white rounded-2xl p-6 mb-8 flex items-center gap-6"
      >
        <div
          class="w-24 h-24 rounded-full overflow-hidden bg-gray-700 flex-shrink-0"
        >
          <img
            v-if="player.photoUrl"
            :src="player.photoUrl"
            :alt="`${player.firstName} ${player.lastName}`"
            class="w-full h-full object-cover"
          />
          <div
            v-else
            class="w-full h-full flex items-center justify-center text-3xl text-gray-500"
          >
            👤
          </div>
        </div>
        <div>
          <h1 class="text-2xl font-bold">
            {{ player.firstName }} {{ player.lastName }}
          </h1>
          <p v-if="player.nickname" class="text-gray-400 text-sm">
            "{{ player.nickname }}"
          </p>
          <div class="flex gap-4 mt-2 text-sm text-gray-300">
            <span v-if="player.position" class="capitalize">{{
              player.position.replace(/_/g, " ").toLowerCase()
            }}</span>
            <span v-if="player.jerseyNumber">#{{ player.jerseyNumber }}</span>
          </div>
        </div>
      </div>

      <!-- Career stats -->
      <h2 class="text-lg font-bold text-gray-800 mb-4">Career Statistics</h2>
      <div v-if="stats" class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div
          v-for="stat in statCards"
          :key="stat.label"
          class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center"
        >
          <p class="text-2xl font-bold text-gray-900">{{ stat.value }}</p>
          <p class="text-xs text-gray-500 mt-1">{{ stat.label }}</p>
        </div>
      </div>

      <!-- Per-tournament breakdown -->
      <h2
        v-if="tournamentStats.length"
        class="text-lg font-bold text-gray-800 mb-4"
      >
        By Tournament
      </h2>
      <div
        v-if="tournamentStats.length"
        class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
      >
        <table class="w-full text-sm">
          <thead class="bg-gray-50 text-gray-600 uppercase text-xs">
            <tr>
              <th class="px-4 py-3 text-left">Tournament</th>
              <th class="px-4 py-3 text-right">Goals</th>
              <th class="px-4 py-3 text-right">Assists</th>
              <th class="px-4 py-3 text-right">Games</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in tournamentStats"
              :key="row.tournamentId"
              class="border-t border-gray-100"
            >
              <td class="px-4 py-3 font-medium">
                {{ row.tournamentName ?? "Season" }}
              </td>
              <td class="px-4 py-3 text-right font-bold text-brand">
                {{ row.goals }}
              </td>
              <td class="px-4 py-3 text-right text-gray-600">
                {{ row.assists }}
              </td>
              <td class="px-4 py-3 text-right text-gray-600">
                {{ row.appearances }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
    <div v-else class="text-center py-16 text-gray-500">Player not found.</div>
  </div>
</template>
