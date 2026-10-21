<script setup lang="ts">
import { FORMATIONS, GameStatus, type Game } from "@ministrosfc/shared";
import type { GameFormData } from "../../../../components/pages/admin/games/GameForm.vue";
import GameForm from "../../../../components/pages/admin/games/GameForm.vue";

definePageMeta({
  layout: "admin",
  middleware: "auth",
  requiresAuth: true,
  requiresRole: "editor",
  pageTitle: "Editar Partido",
});

const router = useRouter();
const route = useRoute();
const gameId = route.params.id as string;
const loading = ref(true);
const error = ref("");
const game = ref<Game | null>(null);

useHead(() => ({
  title: game.value
    ? `Edit vs ${game.value.opponentTeam?.name} – Admin`
    : "Edit Game",
}));

// async function submit() {
//   error.value = "";
//   loading.value = true;
//   try {
//     const body: Record<string, any> = {
//       date: toISOWithOffset(form.date, form.time),
//       notes: form.notes,
//       playgroundId: form.playgroundId ?? null,
//       maxPlayers: form.maxPlayers ?? null,
//       lineup: form.lineup ?? "4-4-2",
//     };
//     if (authStore.isAdmin) {
//       body.homeTeamScore = form.homeTeamScore;
//       body.awayTeamScore = form.awayTeamScore;
//       body.status = form.status;
//     }
//     await $api(`/api/v1/games/${id}`, { method: "PATCH", body });
//     await router.push("/admin/games");
//   } catch (e: any) {
//     error.value = e?.message ?? "No se pudo guardar el partido.";
//   } finally {
//     loading.value = false;
//   }
// }

const { updateGame, fetchGame: fetchGameById } = useGames();
onMounted(async () => {
  game.value = await fetchGameById(gameId);
  loading.value = false;
});

async function handleSubmit(payload: GameFormData) {
  debugger;
  const saving = ref(false);
  const error = ref("");
  saving.value = true;

  try {
    debugger;
    await updateGame(gameId, payload);

    await router.push("/admin/games");
  } catch (e: any) {
    error.value = e?.message ?? "No se pudo guardar el partido.";
  } finally {
    saving.value = false;
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
      :data="game"
      loadingMessage="Cargando partido…"
      emptyMessage="No se encontró el partido solicitado."
    />

    <GameForm
      v-else
      submitLabel="Guardar Cambios"
      :game="game"
      @submit="handleSubmit"
    />
  </div>
</template>
