<script setup lang="ts">
import type { OrphanPlayerItem } from "@ministrosfc/shared";
import UserEditorPanel from "~/components/pages/admin/users/UserEditorPanel.vue";
import { useGetOrphanPlayers } from "~/composables/admin/useGetOrphanPlayers";
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
const { fetchGlobalOrphanPlayers } = useGetOrphanPlayers();

const userId = computed(() => String(route.params.userId));

const { user, loading, error, fetchUser } = useGetUser(userId);
const orphanPlayers = ref<OrphanPlayerItem[]>([]);
async function fetchOrphanPlayers(query = "") {
  orphanPlayers.value = await fetchGlobalOrphanPlayers({
    page: 1,
    limit: 20,
    search: query,
  });
}

async function saveProfile(payload: {
  firstName: string;
  lastName: string;
  email: string;
  expectedUpdatedAt: string;
}) {
  await ($api as any)(`/api/v1/admin/users/${userId.value}`, {
    method: "PATCH",
    body: payload,
  });
  await fetchUser();
}

async function mergePlayer(payload: {
  mergePlayerId: string;
  expectedUpdatedAt: string;
}) {
  await ($api as any)(`/api/v1/admin/users/${userId.value}/merge-player`, {
    method: "POST",
    body: payload,
  });
  await fetchUser();
}

await Promise.all([fetchUser(), fetchOrphanPlayers()]);
</script>

<template>
  <div class="space-y-4">
    <p
      v-if="error"
      class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      {{ error }}
    </p>

    <UserEditorPanel
      :user="user"
      :orphan-players="orphanPlayers"
      :loading="loading"
      @save-profile="saveProfile"
      @search-orphans="fetchOrphanPlayers"
      @merge-player="mergePlayer"
    />
  </div>
</template>
