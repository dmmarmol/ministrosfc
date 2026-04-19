<script setup lang="ts">
definePageMeta({ public: true });
useHead({ title: "Roster – Ministros FC" });

import { PlayerStatus } from "@ministrosfc/shared";
import { useAuthStore } from "~/stores/auth";

const { $api } = useNuxtApp();
const authStore = useAuthStore();

const search = ref("");
const positionFilter = ref("");
const statusFilter = ref<PlayerStatus | "ALL">(PlayerStatus.ACTIVE);

const { data, pending } = await useAsyncData(
  "roster",
  () =>
    $api<{ data: any[] }>("/api/v1/players", {
      query: {
        status: statusFilter.value,
        limit: 100,
      },
    }),
  { watch: [statusFilter] },
);

const players = computed(() =>
  (data.value?.data ?? []).filter((p: any) => p.playerType !== "GUEST"),
);

const filteredPlayers = computed(() => {
  let list = players.value;
  if (positionFilter.value)
    list = list.filter((p: any) => p.position === positionFilter.value);
  if (search.value.trim()) {
    const q = search.value.trim().toLowerCase();
    list = list.filter(
      (p: any) =>
        p.firstName?.toLowerCase().includes(q) ||
        p.lastName?.toLowerCase().includes(q) ||
        p.nickname?.toLowerCase().includes(q),
    );
  }
  return list;
});
</script>

<template>
  <div>
    <!-- Filters -->
    <div class="flex flex-col sm:flex-row gap-3 mb-6">
      <select
        v-if="authStore.isAuthenticated"
        v-model="statusFilter"
        class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
      >
        <option :value="PlayerStatus.ACTIVE">Activos</option>
        <option :value="PlayerStatus.INACTIVE">Inactivos</option>
        <option value="ALL">Todos</option>
      </select>
      <input
        v-model="search"
        type="text"
        placeholder="Buscar jugador…"
        class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
      />
      <select
        v-model="positionFilter"
        class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
      >
        <option value="">Todas las posiciones</option>
        <option value="GK">Portero</option>
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
      <PlayerCard
        v-for="player in filteredPlayers"
        :key="player.id"
        :player="player"
      />
    </div>
    <div v-else class="text-center py-16 text-gray-500">
      <p class="text-lg">No se encontraron jugadores.</p>
    </div>
  </div>
</template>
