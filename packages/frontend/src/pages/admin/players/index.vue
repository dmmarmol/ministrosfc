<script setup lang="ts">
import { nextTick } from "vue";
import { PlayerStatus, OPTION_FILTER_ALL, Position } from "@ministrosfc/shared";
import PlayerDeleteModal from "~/components/player/PlayerDeleteModal.vue";
import ConfirmationModal from "~/components/ui/ConfirmationModal.vue";
import PlayersTable, {
  type AdminPlayer,
  type ExtendAdminPlayerAttr,
} from "~/components/pages/admin/players/PlayersTable.vue";

definePageMeta({
  layout: "admin",
  middleware: "auth",
  requiresAuth: true,
  requiresRole: "editor",
  pageTitle: "Jugadores",
});
useHead({ title: "Players – Admin" });

const { $api } = useNuxtApp();
const playerToDelete = ref<{
  id: string;
  firstName: string;
  lastName: string;
} | null>(null);
const playerToToggleStatus = ref<any | null>(null);
const toggleStatusModalOpen = ref(false);
const toggleStatusInvoker = ref<HTMLElement | null>(null);
const search = ref("");
const statusFilter = ref<PlayerStatus | typeof OPTION_FILTER_ALL>(
  OPTION_FILTER_ALL,
);

const posFilter = ref<Position | typeof OPTION_FILTER_ALL>(OPTION_FILTER_ALL);

const { data, pending, refresh } = await useAsyncData(
  "admin-players",
  async () => {
    return $api<{ data: AdminPlayer[] }>("/api/v1/players", {
      query: createTruthyObject({
        status:
          statusFilter.value === OPTION_FILTER_ALL
            ? undefined
            : statusFilter.value,
        limit: 200,
        extend: [
          "invitedById",
          "invitedByName",
        ] as (keyof ExtendAdminPlayerAttr)[],
      }),
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
  if (posFilter.value && posFilter.value !== OPTION_FILTER_ALL) {
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
      <UiPlayerStatusSelect v-model="statusFilter" include-all size="xl" />
      <UiPositionSelect v-model="posFilter" size="xl" />
    </div>

    <!-- Table -->
    <PlayersTable
      :players="filteredPlayers"
      :loading="pending"
      @toggle-status="askToggleStatus"
      @delete="playerToDelete = $event"
    />
  </div>
</template>
