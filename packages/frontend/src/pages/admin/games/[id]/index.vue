<script setup lang="ts">
import {
  DEFAULT_LINEUP,
  toISOWithOffset,
  type GameUpdatePayload,
} from "@ministrosfc/shared";
import type { GameFormData } from "../../../../components/pages/admin/games/GameForm.vue";
import GameForm from "../../../../components/pages/admin/games/GameForm.vue";
import PageLoading from "../../../../components/ui/PageLoading.vue";
import GameParticipantRemoveModal from "../../../../components/pages/admin/games/GameParticipantRemoveModal.vue";
import { useAdminGamesStore } from "../../../../stores/admin-games.js";
import { useGames } from "~/composables/useGames";
import { useAuthStore } from "~/stores/auth";

definePageMeta({
  layout: "admin",
  middleware: "auth",
  requiresAuth: true,
  requiresRole: "editor",
  pageTitle: "Editar Partido",
});

const router = useRouter();
const route = useRoute();
const store = useAdminGamesStore();
const authStore = useAuthStore();
const gameId = route.params.id as string;
const loading = ref(true);
const error = ref("");

const { updateGame, fetchGameById } = useGames();

onMounted(async () => {
  store.setSelectedGame(await fetchGameById(gameId));
  loading.value = false;
});

useHead(() => ({
  title: store.selectedGame
    ? `Edit vs ${store.selectedGame?.opponentTeam.name} – Admin`
    : "Edit Game",
}));

/** Form */
async function handleSubmit(payload: GameFormData) {
  loading.value = true;

  try {
    const body: GameUpdatePayload = {
      ...payload,
      date: payload.time
        ? toISOWithOffset(payload.date, payload.time)
        : payload.date,
      notes: payload.notes,
      playgroundId: payload.playgroundId ?? null,
      maxPlayers: payload.maxPlayers ?? null,
      lineup: payload.lineup ?? DEFAULT_LINEUP,
    };
    if (authStore.isAdmin) {
      body.homeTeamScore = payload.homeTeamScore;
      body.awayTeamScore = payload.awayTeamScore;
      body.status = payload.status;
    }

    await updateGame(gameId, body);

    await router.push("/admin/games");
  } catch (e: any) {
    error.value = e?.message ?? "No se pudo actualizar el partido.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="space-y-4">
    <header class="mb-4">
      <UiBackButton to="/admin/games" label="Volver a Partidos" />
    </header>

    <h2 class="text-lg font-bold text-gray-900 mb-6">Editar Partido</h2>

    <PageLoading
      v-if="loading"
      :loading="loading"
      :data="store.selectedGame"
      loadingMessage="Cargando partido…"
      emptyMessage="No se encontró el partido solicitado."
    />
    <div v-else>
      <GameParticipantRemoveModal
        v-if="store.selectedGame"
        :open="store.confirmationModalOpen"
        :game-id="store.selectedGame.id"
      />

      <GameForm
        submitLabel="Guardar Cambios"
        :game="store.selectedGame"
        @submit="handleSubmit"
        :error="error"
        :loading="loading"
      />
    </div>
  </div>
</template>
