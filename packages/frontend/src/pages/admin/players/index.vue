<script setup lang="ts">
import { nextTick } from "vue";
import {
  PlayerStatus,
  PLAYER_STATUS_FILTER_ALL,
  PLAYER_POSITION_FILTER_ALL,
  Position,
} from "@ministrosfc/shared";
import { useAuthStore } from "~/stores/auth";
import PlayerDeleteModal from "~/components/player/PlayerDeleteModal.vue";
import ConfirmationModal from "~/components/ui/ConfirmationModal.vue";

definePageMeta({
  layout: "admin",
  middleware: "auth",
  requiresAuth: true,
  requiresRole: "editor",
  pageTitle: "Jugadores",
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

const posFilter = ref<Position | typeof PLAYER_POSITION_FILTER_ALL>(
  PLAYER_POSITION_FILTER_ALL,
);

type ExtendPlayerAttributes = {
  invitedById?: string | null;
  invitedByName?: string | null;
};
type AdminPlayer = Player & ExtendPlayerAttributes;

const { data, pending, refresh } = await useAsyncData(
  "admin-players",
  async () => {
    return $api<{ data: AdminPlayer[] }>("/api/v1/players", {
      query: {
        status: statusFilter.value,
        limit: 200,
        extend: [
          "invitedById",
          "invitedByName",
        ] as (keyof ExtendPlayerAttributes)[],
      },
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
  if (posFilter.value && posFilter.value !== PLAYER_POSITION_FILTER_ALL) {
    list = list.filter((p: any) => p.position === posFilter.value);
  }
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
  const action =
    player.status === PlayerStatus.ACTIVE ? "desactivar" : "activar";
  return `¿Confirmás ${action} a ${player.firstName} ${player.lastName}?`;
}

async function toggleStatus() {
  if (!playerToToggleStatus.value) return;
  const player = playerToToggleStatus.value;
  const newStatus =
    player.status === PlayerStatus.ACTIVE
      ? PlayerStatus.INACTIVE
      : PlayerStatus.ACTIVE;
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
        playerToToggleStatus?.status === PlayerStatus.ACTIVE
          ? 'Desactivar jugador'
          : 'Activar jugador'
      "
      :description="getToggleStatusDescription(playerToToggleStatus)"
      :confirm-text="
        playerToToggleStatus?.status === PlayerStatus.ACTIVE
          ? 'Desactivar'
          : 'Activar'
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
      <UButton
        to="/admin/players/create"
        variant="solid"
        color="primary"
        icon="mdi:account-plus"
        >Agregar Jugador</UButton
      >
    </div>

    <!-- Filters -->
    <div class="flex flex-col sm:flex-row gap-3 mb-4">
      <UInput v-model="search" placeholder="Buscar…" class="flex-1" size="xl" />
      <UiPlayerStatusSelect v-model="statusFilter" size="xl" />
      <UiPositionSelect v-model="posFilter" size="xl" />
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
            <th class="px-4 py-3 text-left">#</th>
            <th class="px-2 py-3 text-left">Posición</th>
            <th class="px-2 py-3 text-left">Img</th>
            <th class="px-2 py-3 text-left">Jugador</th>
            <th class="px-2 py-3 text-left">Invitado por</th>
            <th class="px-2 py-3 text-center">Dorsal</th>
            <th class="px-2 py-3 text-center">Estado</th>
            <th class="px-2 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(p, index) in filteredPlayers"
            :key="p.id"
            class="border-t border-gray-100 hover:bg-gray-50"
          >
            <!-- Player # -->
            <td class="px-4 py-3 w-10 text-gray-400">
              {{ index + 1 }}
            </td>
            <!-- Position -->
            <td class="px-2 py-3 w-10 text-gray-600 hidden lg:table-cell">
              <UiPositionLabel :position="p.position" />
            </td>
            <!-- Player Image -->
            <td class="px-2 py-3 w-10 text-gray-600 hidden lg:table-cell">
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
            </td>
            <!-- Player Name -->
            <td class="text-gray-600 hidden lg:table-cell">
              <div class="min-w-0">
                <UButton
                  :to="`/admin/players/${p.id}/edit`"
                  class="truncate"
                  variant="ghost"
                  color="neutral"
                  >{{ p.firstName }} {{ p.lastName }}</UButton
                >
                <span v-if="p.nickname" class="text-sm text-gray-400">{{
                  p.nickname
                }}</span>
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
            <!-- Invited By -->
            <td class="py-3 hidden lg:table-cell">
              <div class="flex items-center gap-1 mt-0.5 flex-wrap">
                <!-- T040: guest badge -->
                <span
                  v-if="p.playerType === 'GUEST'"
                  class="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full"
                  >Invitado</span
                >
                <span class="text-gray-600" v-if="p.invitedById">
                  <a
                    v-if="p.invitedByName"
                    :href="`/admin/players/${p.invitedById}/edit`"
                    class="text-xs text-gray-500 hover:underline"
                    >{{ p.invitedByName }}</a
                  >
                  <template v-else> (invitante eliminado) </template>
                </span>
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
            </td>
            <!-- Jersey Number -->
            <td class="py-3 hidden lg:table-cell">
              <div class="w-full lg:flex lg:justify-center">
                <UiPositionNumber
                  :jersey-number="p.jerseyNumber ?? null"
                  :is-guest="p.playerType === 'GUEST'"
                  :is-jersey="true"
                />
              </div>
            </td>
            <!-- Status -->
            <td class="px-2 py-3 text-center">
              <UButton
                variant="soft"
                :color="
                  p.status === PlayerStatus.ACTIVE ? 'success' : 'neutral'
                "
                :title="
                  p.status === PlayerStatus.ACTIVE
                    ? 'Presiona para desactivar jugador'
                    : 'Presiona para activar jugador'
                "
                @click="askToggleStatus(p, $event)"
                size="xs"
                class="font-medium"
              >
                {{ p.status === PlayerStatus.ACTIVE ? "Activo" : "Inactivo" }}
              </UButton>
            </td>
            <td class="px-2 py-3 text-right space-x-3">
              <UButton
                v-if="authStore.isAdmin"
                data-testid="delete-player-btn"
                variant="ghost"
                color="error"
                size="xl"
                @click="playerToDelete = p"
                icon="mdi:trash-can-outline"
                title="Eliminar jugador"
              />
            </td>
          </tr>
          <tr v-if="!filteredPlayers.length">
            <td colspan="5" class="px-2 py-8 text-center text-gray-500">
              No se encontraron jugadores.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
