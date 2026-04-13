<script setup lang="ts">
import { nextTick } from "vue";
import { PlayerStatus, PLAYER_STATUS_FILTER_ALL } from "@ministrosfc/shared";
import { useAuthStore } from "~/stores/auth";
import PlayerDeleteModal from "~/components/player/PlayerDeleteModal.vue";
import ConfirmationModal from "~/components/ui/ConfirmationModal.vue";

definePageMeta({
  layout: "admin",
  middleware: "auth",
  requiresAuth: true,
  requiresRole: "editor",
});
useHead({ title: "Players – Admin" });

const { $api } = useNuxtApp();
const authStore = useAuthStore();
const playerToDelete = ref<{
  id: string;
  firstName: string;
  lastName: string;
} | null>(null);
const playerToToggleStatus = ref<any | null>(null);
const toggleStatusModalOpen = ref(false);
const toggleStatusInvoker = ref<HTMLElement | null>(null);
const search = ref("");
const statusFilter = ref<PlayerStatus | typeof PLAYER_STATUS_FILTER_ALL>(
  PLAYER_STATUS_FILTER_ALL,
);
const posFilter = ref("");

const { data, pending, refresh } = await useAsyncData(
  "admin-players",
  async () => {
    return $api<{ data: any[] }>("/api/v1/players", {
      query: { status: statusFilter.value, limit: 200 },
    });
  },
);
watch(statusFilter, () => refresh());
watch(toggleStatusModalOpen, (isOpen) => {
  if (!isOpen && toggleStatusInvoker.value) {
    nextTick(() => toggleStatusInvoker.value?.focus());
  }
});

const players = computed(() => data.value?.data ?? []);
const filteredPlayers = computed(() => {
  let list = players.value;
  if (posFilter.value)
    list = list.filter((p: any) => p.position === posFilter.value);
  if (search.value.trim()) {
    const q = search.value.trim().toLowerCase();
    list = list.filter((p: any) =>
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(q),
    );
  }
  return list;
});

function askToggleStatus(player: any, event: Event) {
  playerToToggleStatus.value = player;
  toggleStatusInvoker.value = event.currentTarget as HTMLElement;
  toggleStatusModalOpen.value = true;
}

function getToggleStatusDescription(player: any | null): string {
  if (!player) return "";
  const action = player.status === "ACTIVE" ? "desactivar" : "activar";
  return `¿Confirmás ${action} a ${player.firstName} ${player.lastName}?`;
}

async function toggleStatus() {
  if (!playerToToggleStatus.value) return;
  const player = playerToToggleStatus.value;
  const newStatus = player.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
  await $api(`/api/v1/players/${player.id}/status`, {
    method: "PATCH",
    body: { status: newStatus },
  });
  toggleStatusModalOpen.value = false;
  playerToToggleStatus.value = null;
  await refresh();
}

async function confirmDelete() {
  if (!playerToDelete.value) return;
  try {
    await $api(`/api/v1/players/${playerToDelete.value.id}`, {
      method: "DELETE",
    });
    playerToDelete.value = null;
    await refresh();
  } catch (e: any) {
    playerToDelete.value = null;
    alert(e?.message ?? "No se pudo eliminar el jugador.");
  }
}
</script>

<template>
  <div>
    <ConfirmationModal
      :open="toggleStatusModalOpen"
      :title="
        playerToToggleStatus?.status === 'ACTIVE'
          ? 'Desactivar jugador'
          : 'Activar jugador'
      "
      :description="getToggleStatusDescription(playerToToggleStatus)"
      :confirm-text="
        playerToToggleStatus?.status === 'ACTIVE' ? 'Desactivar' : 'Activar'
      "
      cancel-text="Cancelar"
      :on-confirm="toggleStatus"
      :on-cancel="
        () => {
          toggleStatusModalOpen = false;
          playerToToggleStatus = null;
        }
      "
      @update:open="(value) => (toggleStatusModalOpen = value)"
    />

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
        <option :value="PlayerStatus.ACTIVE">Activo</option>
        <option :value="PlayerStatus.INACTIVE">Inactivo</option>
        <option :value="PLAYER_STATUS_FILTER_ALL">Todos</option>
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
                  :alt="`${p.firstName} ${p.lastName}`"
                />
                <span
                  v-else
                  class="w-full h-full flex items-center justify-center text-xs text-gray-400"
                  >👤</span
                >
              </div>
              <div class="min-w-0">
                <span class="font-medium text-gray-900 block truncate"
                  >{{ p.firstName }} {{ p.lastName }}</span
                >
                <div class="flex items-center gap-1 mt-0.5 flex-wrap">
                  <!-- T040: guest badge -->
                  <span
                    v-if="p.playerType === 'GUEST'"
                    class="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full"
                    >Invitado</span
                  >
                  <!-- T041: deleted inviter warning -->
                  <span
                    v-if="
                      p.playerType === 'GUEST' &&
                      p.invitedById &&
                      !p.invitedByName
                    "
                    class="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full"
                    >Invitante eliminado</span
                  >
                </div>
              </div>
            </td>
            <td class="px-4 py-3 text-gray-600 hidden sm:table-cell">
              <UiPositionLabel :position="p.position" />
            </td>
            <td class="px-4 py-3 text-right text-gray-600 hidden sm:table-cell">
              <UiPositionNumber
                :jersey-number="p.jerseyNumber"
                :is-guest="p.playerType === 'GUEST'"
                :is-jersey="true"
              />
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
                @click="askToggleStatus(p, $event)"
              >
                {{ p.status === "ACTIVE" ? "Desactivar" : "Activar" }}
              </button>
              <button
                v-if="authStore.isAdmin"
                data-testid="delete-player-btn"
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
