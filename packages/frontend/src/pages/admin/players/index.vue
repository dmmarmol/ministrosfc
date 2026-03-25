<template>
  <div>
    <!-- Confirmation modal (admin only) -->
    <PlayerDeleteModal
      v-if="playerToDelete"
      :player="playerToDelete"
      @confirm="confirmDelete"
      @cancel="playerToDelete = null"
    />

    <div class="flex items-center justify-between mb-6">
      <h2 class="text-base font-semibold text-gray-700">Jugadores</h2>
      <NuxtLink
        to="/admin/players/create"
        class="bg-brand text-gray-900 font-semibold text-sm px-4 py-2 rounded-lg hover:opacity-90"
        >+ Agregar Jugador</NuxtLink
      >
    </div>

    <!-- Filters -->
    <div class="flex flex-col sm:flex-row gap-3 mb-4">
      <input
        v-model="search"
        type="text"
        placeholder="Buscar…"
        class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
      />
      <select
        v-model="statusFilter"
        class="border border-gray-300 rounded-lg px-3 py-2 text-sm"
      >
        <option value="ACTIVE">Activo</option>
        <option value="INACTIVE">Inactivo</option>
        <option value="">Todos</option>
      </select>
      <select
        v-model="posFilter"
        class="border border-gray-300 rounded-lg px-3 py-2 text-sm"
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

    <!-- Table -->
    <div
      class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
    >
      <div v-if="pending" class="p-6 space-y-3">
        <div
          v-for="i in 8"
          :key="i"
          class="h-10 bg-gray-100 animate-pulse rounded"
        />
      </div>
      <table v-else class="w-full text-sm">
        <thead class="bg-gray-50 text-gray-500 uppercase text-xs">
          <tr>
            <th class="px-4 py-3 text-left">Jugador</th>
            <th class="px-4 py-3 text-left hidden sm:table-cell">Posición</th>
            <th class="px-4 py-3 text-right hidden sm:table-cell">#</th>
            <th class="px-4 py-3 text-center">Estado</th>
            <th class="px-4 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="p in filteredPlayers"
            :key="p.id"
            class="border-t border-gray-100 hover:bg-gray-50"
          >
            <td class="px-4 py-3 flex items-center gap-3">
              <div
                class="w-8 h-8 rounded-full bg-gray-100 overflow-hidden flex-shrink-0"
              >
                <img
                  v-if="p.photoUrl"
                  :src="p.photoUrl"
                  class="w-full h-full object-cover"
                  :alt="p.name"
                />
                <span
                  v-else
                  class="w-full h-full flex items-center justify-center text-xs text-gray-400"
                  >👤</span
                >
              </div>
              <span class="font-medium text-gray-900">{{ p.name }}</span>
            </td>
            <td class="px-4 py-3 text-gray-600 hidden sm:table-cell">
              {{ p.position ?? "—" }}
            </td>
            <td class="px-4 py-3 text-right text-gray-600 hidden sm:table-cell">
              {{ p.jerseyNumber ?? "—" }}
            </td>
            <td class="px-4 py-3 text-center">
              <span
                :class="
                  p.status === 'ACTIVE'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                "
                class="text-xs px-2 py-0.5 rounded-full font-medium"
                >{{ p.status === "ACTIVE" ? "Activo" : "Inactivo" }}</span
              >
            </td>
            <td class="px-4 py-3 text-right space-x-3">
              <NuxtLink
                :to="`/admin/players/${p.id}/edit`"
                class="text-xs text-brand hover:underline"
                >Editar</NuxtLink
              >
              <button
                class="text-xs text-gray-400 hover:text-red-500 transition-colors"
                @click="toggleStatus(p)"
              >
                {{ p.status === "ACTIVE" ? "Desactivar" : "Activar" }}
              </button>
              <button
                v-if="authStore.isAdmin"
                class="text-xs text-red-400 hover:text-red-600 transition-colors"
                @click="playerToDelete = p"
              >
                Eliminar
              </button>
            </td>
          </tr>
          <tr v-if="!filteredPlayers.length">
            <td colspan="5" class="px-4 py-8 text-center text-gray-500">
              No se encontraron jugadores.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "admin", middleware: "auth" });
useHead({ title: "Players – Admin" });

const { $api } = useNuxtApp();
const authStore = useAuthStore();
const playerToDelete = ref<{ id: string; name: string } | null>(null);
const search = ref("");
const statusFilter = ref("ACTIVE");
const posFilter = ref("");

const { data, pending, refresh } = await useAsyncData("admin-players", () =>
  $api<{ data: any[] }>("/api/v1/players", {
    query: { status: statusFilter.value || undefined, limit: 200 },
  }),
);
watch(statusFilter, () => refresh());

const players = computed(() => data.value?.data ?? []);
const filteredPlayers = computed(() => {
  let list = players.value;
  if (posFilter.value)
    list = list.filter((p: any) => p.position === posFilter.value);
  if (search.value.trim()) {
    const q = search.value.trim().toLowerCase();
    list = list.filter((p: any) => p.name?.toLowerCase().includes(q));
  }
  return list;
});

async function toggleStatus(player: any) {
  const newStatus = player.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
  try {
    await $api(`/api/v1/players/${player.id}/status`, {
      method: "PATCH",
      body: { status: newStatus },
    });
    await refresh();
  } catch (e: any) {
    alert(e?.message ?? "Failed to update player status.");
  }
}

async function confirmDelete() {
  if (!playerToDelete.value) return;
  try {
    await $api(`/api/v1/players/${playerToDelete.value.id}`, { method: "DELETE" });
    playerToDelete.value = null;
    await refresh();
  } catch (e: any) {
    playerToDelete.value = null;
    alert(e?.message ?? "Failed to delete player.");
  }
}
</script>
