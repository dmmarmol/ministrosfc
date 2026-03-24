<template>
  <div>
    <!-- Format filter -->
    <div class="flex flex-wrap gap-2 mb-6">
      <button
        v-for="fmt in formats"
        :key="fmt.value"
        :class="
          formatFilter === fmt.value
            ? 'bg-brand text-gray-900 font-semibold'
            : 'bg-white text-gray-600 hover:bg-gray-50'
        "
        class="px-4 py-1.5 rounded-full text-sm border border-gray-200 transition-colors"
        @click="formatFilter = fmt.value"
      >
        {{ fmt.label }}
      </button>
    </div>

    <!-- List -->
    <div v-if="pending" class="grid sm:grid-cols-2 gap-4">
      <div
        v-for="i in 4"
        :key="i"
        class="h-32 bg-gray-200 animate-pulse rounded-xl"
      />
    </div>
    <div v-else-if="tournaments.length" class="grid sm:grid-cols-2 gap-4">
      <TournamentCard v-for="t in tournaments" :key="t.id" :tournament="t" />
    </div>
    <div v-else class="text-center py-16 text-gray-500">
      No se encontraron torneos.
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({ title: "Tournaments – Ministros FC" });

const { $api } = useNuxtApp();

const formats = [
  { value: "", label: "Todos" },
  { value: "LEAGUE", label: "Liga" },
  { value: "CUP", label: "Copa" },
  { value: "PLAYOFF", label: "Playoff" },
  { value: "SEASON", label: "Temporada" },
  { value: "FRIENDLY", label: "Amistoso" },
];
const formatFilter = ref("");

const { data, pending, refresh } = await useAsyncData("tournaments", () =>
  $api<{ data: any[] }>("/api/v1/tournaments", {
    query: formatFilter.value ? { competitionType: formatFilter.value } : {},
  }),
);

watch(formatFilter, () => refresh());
const tournaments = computed(() => data.value?.data ?? []);
</script>
