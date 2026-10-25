<script setup lang="ts">
import type { OrphanPlayerItem, Player, User } from "@ministrosfc/shared";
import UserEditorPanel from "~/components/pages/admin/users/UserEditorPanel.vue";
import PlayerForm, {
  type PlayerFormData,
} from "~/components/pages/admin/players/PlayerForm.vue";
import { useGetUser } from "~/composables/admin/useGetUser";
import { useGetOrphanPlayers } from "~/composables/admin/useGetOrphanPlayers";

definePageMeta({
  layout: "admin",
  middleware: "auth",
  requiresAuth: true,
  requiresRole: "editor",
  pageTitle: "Editar Usuario",
});

const route = useRoute();
const { $api } = useNuxtApp();
const { fetchPendingUserOrphanPlayers } = useGetOrphanPlayers();

const userId = computed(() => String(route.params.userId));

const { user, loading, error, fetchUser } = useGetUser(userId);
const player = ref<Player | null>(null);
const loadingPlayer = ref(false);
const orphanPlayers = ref<OrphanPlayerItem[]>([]);
const actionLoading = ref(false);

async function fetchPlayer() {
  if (!user.value?.playerId) {
    player.value = null;
    return;
  }

  loadingPlayer.value = true;
  try {
    const response = await $api(
      `/api/v1/players/${user.value.playerId}`,
    );
    player.value = response.data ?? null;
  } catch {
    player.value = null;
  } finally {
    loadingPlayer.value = false;
  }
}

async function saveProfile(payload: {
  firstName: string;
  lastName: string;
  email: string;
  expectedUpdatedAt: string;
}) {
  await $api(`/api/v1/admin/users/${userId.value}`, {
    method: "PATCH",
    body: payload,
  });
  await fetchUser();
}

async function savePlayer(payload: PlayerFormData) {
  if (!user.value?.playerId) return;

  await $api(`/api/v1/players/${user.value.playerId}`, {
    method: "PATCH",
    body: payload,
  });
  await fetchPlayer();
}

async function fetchOrphanPlayers(searchQuery = "") {
  if (!user.value) return;

  orphanPlayers.value = await fetchPendingUserOrphanPlayers(user.value.id, {
    page: 1,
    limit: 100,
    search: searchQuery,
  });
}

async function mergeSelectedPlayer(mergePlayerId: string) {
  if (!user.value) return;

  actionLoading.value = true;
  try {
    await $api(`/api/v1/admin/users/${user.value.id}/merge-player`, {
      method: "POST",
      body: {
        mergePlayerId,
        expectedUpdatedAt: user.value.updatedAt,
      },
    });
    await fetchUser();
    await fetchPlayer();
    orphanPlayers.value = [];
  } finally {
    actionLoading.value = false;
  }
}

const userInitialData = computed(() => {
  if (!user.value) return {};
  return {
    email: user.value.email,
    firstName: user.value.firstName,
    lastName: user.value.lastName,
    expectedUpdatedAt: user.value.updatedAt,
  };
});

const playerInitialData = computed(() => {
  if (!player.value) return {};

  return {
    firstName: player.value.firstName ?? "",
    lastName: player.value.lastName ?? "",
    nickname: player.value.nickname ?? "",
    position: player.value.position ?? undefined,
    jerseyNumber: player.value.jerseyNumber
      ? String(player.value.jerseyNumber)
      : undefined,
    dateOfBirth: player.value.dateOfBirth
      ? player.value.dateOfBirth.split("T")[0]
      : "",
    invitedById: player.value.invitedById ?? undefined,
    photo: player.value.photoUrl ?? undefined,
  };
});

await fetchUser();
await fetchPlayer();
await fetchOrphanPlayers();
</script>

<template>
  <div class="space-y-4">
    <p
      v-if="error"
      class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      {{ error }}
    </p>
    <UiBackButton to="/admin/users" label="Volver a Usuarios" />

    <div class="grid grid-cols-12 gap-4">
      <div class="col-span-12 lg:col-span-6">
        <UserEditorPanel
          :user="(user as User | null)"
          :orphan-players="orphanPlayers"
          :action-loading="actionLoading"
          :loading="loading"
          @save="saveProfile"
          @merge="mergeSelectedPlayer"
          @search-orphans="fetchOrphanPlayers"
        />
      </div>

      <div v-if="user?.playerId" class="col-span-12 lg:col-span-6">
        <PlayerForm
          :initial-data="playerInitialData"
          :player-id="user.playerId"
          :submit-label="loadingPlayer ? 'Guardando...' : 'Guardar jugador'"
          @submit="savePlayer"
        />
      </div>
    </div>
  </div>
</template>
