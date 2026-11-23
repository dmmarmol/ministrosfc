<script setup lang="ts">
import { computed, ref, watch } from "vue";
definePageMeta({ public: true });
useHead({ title: "Plantel" });

import {
  OPTION_FILTER_ALL,
  PlayerStatus,
  PlayerType,
  type PlayerPublic,
} from "@ministrosfc/shared";
import { useAuthStore } from "~/stores/auth";
import {
  filterRegisteredPlayers,
  resolveRosterStatus,
} from "~/utils/roster";

const { $api } = useNuxtApp();
const authStore = useAuthStore();

const search = ref("");
const positionFilter = ref("");
const statusFilter = ref<PlayerStatus | typeof OPTION_FILTER_ALL>(
  PlayerStatus.ACTIVE,
);

const { data, pending } = await useAsyncData(
  "roster",
  () =>
    $api<{ data: PlayerPublic[] }>("/api/v1/players", {
      query: {
        status: statusFilter.value,
        playerType: PlayerType.REGISTERED,
        search: search.value.trim() || undefined,
        limit: 100,
      },
    }),
  { watch: [statusFilter, search] },
);

watch(search, (value) => {
  statusFilter.value = resolveRosterStatus(value, statusFilter.value);
});

const filteredPlayers = computed(() => {
  return filterRegisteredPlayers(
    data.value?.data ?? [],
    search.value,
    positionFilter.value,
    statusFilter.value,
  );
});

function handleStatusSelected(
  status: PlayerStatus | typeof OPTION_FILTER_ALL | undefined,
) {
  statusFilter.value = status ?? OPTION_FILTER_ALL;
}

function statusLabel(status: unknown): string {
  if (status === PlayerStatus.ACTIVE) return "Activo";
  if (status === PlayerStatus.INACTIVE) return "Inactivo";
  return "Sin estado";
}
</script>

<template>
  <div>
    <!-- Filters -->
    <div class="flex flex-col sm:flex-row gap-3 mb-6">
      <UiPlayerStatusSelect
        v-if="authStore.isAuthenticated"
        v-model="statusFilter"
        :include-all="true"
        @selected="handleStatusSelected"
      />
      <input
        v-model="search"
        type="text"
        placeholder="Buscá un jugador…"
        class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
      />
      <select
        v-model="positionFilter"
        class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
      >
        <option value="">Todas las posiciones</option>
        <option value="GK">Arquero</option>
        <option value="CB">Defensa Central</option>
        <option value="RB">Lateral Derecho</option>
        <option value="LB">Lateral Izquierdo</option>
        <option value="RWB">Carrilero Derecho</option>
        <option value="LWB">Carrilero Izquierdo</option>
        <option value="DMF">Mediocampista Defensivo</option>
        <option value="CMF">Mediocampista Central</option>
        <option value="AMF">Mediocampista Ofensivo</option>
        <option value="RMF">Mediocampista Derecho</option>
        <option value="LMF">Mediocampista Izquierdo</option>
        <option value="SS">Segundo Delantero</option>
        <option value="CF">Delantero Centro</option>
        <option value="RWF">Extremo Derecho</option>
        <option value="LWF">Extremo Izquierdo</option>
      </select>
    </div>

    <!-- Grid -->
    <div
      v-if="pending"
      class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4"
    >
      <div
        v-for="i in 10"
        :key="i"
        class="aspect-square bg-gray-200 animate-pulse rounded-xl"
      />
    </div>
    <div
      v-else-if="filteredPlayers.length"
      class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4"
    >
      <div v-for="player in filteredPlayers" :key="player.id">
        <p
          v-if="statusFilter === OPTION_FILTER_ALL"
          class="mb-1 text-xs font-medium text-gray-600"
        >
          {{ statusLabel(player.status) }}
        </p>
        <PlayerCard :player="player" />
      </div>
    </div>
    <div v-else class="text-center py-16 text-gray-500">
      <p class="text-lg">No se encontraron jugadores.</p>
    </div>
  </div>
</template>
