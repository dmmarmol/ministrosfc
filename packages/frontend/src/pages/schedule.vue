<template>
  <div>
    <!-- Tabs -->
    <div class="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        :class="
          activeTab === tab.key
            ? 'bg-white shadow-sm text-gray-900 font-semibold'
            : 'text-gray-500 hover:text-gray-700'
        "
        class="px-4 py-2 rounded-md text-sm transition-all"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Filters -->
    <div class="flex flex-col sm:flex-row gap-3 mb-6">
      <select
        v-model="opponentFilter"
        class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
      >
        <option value="">Todos los rivales</option>
        <option v-for="team in teams" :key="team.id" :value="team.id">
          {{ team.name }}
        </option>
      </select>
    </div>

    <!-- List -->
    <div v-if="pending" class="space-y-3">
      <div
        v-for="i in 5"
        :key="i"
        class="h-16 bg-gray-200 animate-pulse rounded-xl"
      />
    </div>
    <div v-else-if="games.length" class="space-y-3">
      <GameCard v-for="game in games" :key="game.id" :game="game" />
    </div>
    <div v-else class="text-center py-16 text-gray-500">
      <p>
        {{
          activeTab === "upcoming"
            ? "No hay partidos próximos."
            : "No hay partidos anteriores."
        }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({ title: "Schedule – Ministros FC" });

const { $api } = useNuxtApp();

const tabs = [
  { key: "upcoming", label: "Próximos" },
  { key: "past", label: "Resultados Anteriores" },
];
const activeTab = ref("upcoming");
const opponentFilter = ref("");

const { data: teamsData } = await useAsyncData("schedule-teams", () =>
  $api<{ data: any[] }>("/api/v1/teams"),
);
const teams = computed(() => teamsData.value?.data ?? []);

const query = computed(() => ({
  status: activeTab.value === "upcoming" ? "SCHEDULED" : "COMPLETED",
  ...(opponentFilter.value ? { opponentTeamId: opponentFilter.value } : {}),
  limit: 50,
}));

const { data, pending, refresh } = await useAsyncData("schedule", () =>
  $api<{ data: any[] }>("/api/v1/games", { query: query.value }),
);

watch([activeTab, opponentFilter], () => refresh());

const games = computed(() => data.value?.data ?? []);
</script>
