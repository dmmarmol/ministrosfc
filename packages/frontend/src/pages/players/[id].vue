<script setup lang="ts">
definePageMeta({ public: true });
import { useGetPlayerById } from "~/composables/useGetPlayerById";
import { useGetPlayerStatsById } from "~/composables/useGetPlayerStatsById";
const route = useRoute();
const router = useRouter();
const id = route.params.id as string;

const year = computed(() => route.query.year as string | undefined);

const { player, pending } = await useGetPlayerById(id);

const { stats, availableYears } = await useGetPlayerStatsById(id, { year });

const statCards = computed(() => {
  const s = stats.value;
  return [
    { label: "Goles", value: s?.goalsScored ?? 0 },
    { label: "Asistencias", value: s?.assists ?? 0 },
    { label: "Partidos", value: s?.appearances ?? 0 },
    { label: "Tarjetas amarillas", value: s?.yellowCards ?? 0 },
    { label: "Tarjetas rojas", value: s?.redCards ?? 0 },
    { label: "Minutos", value: s?.totalMinutes ?? 0 },
  ];
});

async function onYearChange(e: Event) {
  const val = (e.target as HTMLSelectElement).value;
  await router.push({ query: { ...route.query, year: val || undefined } });
}

useHead(() => ({
  title: player.value
    ? `${player.value.firstName} ${player.value.lastName} – Ministros FC`
    : "Jugador no encontrado – Ministros FC",
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
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-bold text-gray-800">Estadísticas de carrera</h2>
        <select
          :value="year"
          class="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand"
          @change="onYearChange"
        >
          <option value="">Todos los años</option>
          <option
            v-for="y in availableYears"
            :key="y"
            :value="String(y)"
          >
            {{ y }}
          </option>
        </select>
      </div>
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

      <!-- Per-tournament breakdown: not yet available from API -->
    </template>
    <div v-else class="text-center py-16 text-gray-500">
      Jugador no encontrado.
    </div>
  </div>
</template>
