<script setup lang="ts">
import type { Player } from "@ministrosfc/shared";
import UserForm, {
  type UserFormData,
} from "~/components/pages/admin/users/UserForm.vue";
import PlayerForm, {
  type PlayerFormData,
} from "~/components/pages/admin/players/PlayerForm.vue";
import { useGetUser } from "~/composables/admin/useGetUser";

definePageMeta({
  layout: "admin",
  middleware: "auth",
  requiresAuth: true,
  requiresRole: "editor",
  pageTitle: "Editar Usuario",
});

const route = useRoute();
const { $api } = useNuxtApp();

const userId = computed(() => String(route.params.userId));

const { user, loading, error, fetchUser } = useGetUser(userId);
const player = ref<Player | null>(null);
const loadingPlayer = ref(false);

async function fetchPlayer() {
  if (!user.value?.playerId) {
    player.value = null;
    return;
  }

  loadingPlayer.value = true;
  try {
    const response = await ($api as any)(
      `/api/v1/players/${user.value.playerId}`,
    );
    player.value = response.data ?? null;
  } catch {
    player.value = null;
  } finally {
    loadingPlayer.value = false;
  }
}

async function saveProfile(payload: UserFormData) {
  await ($api as any)(`/api/v1/admin/users/${userId.value}`, {
    method: "PATCH",
    body: payload,
  });
  await fetchUser();
}

async function savePlayer(payload: PlayerFormData) {
  if (!user.value?.playerId) return;

  await ($api as any)(`/api/v1/players/${user.value.playerId}`, {
    method: "PATCH",
    body: payload,
  });
  await fetchPlayer();
}

const userInitialData = computed(() => {
  if (!user.value) return {};
  return {
    email: user.value.email,
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
        <UserForm
          :initial-data="userInitialData"
          :loading="loading"
          submit-label="Guardar perfil"
          cancel-to="/admin/users"
          @submit="saveProfile"
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
