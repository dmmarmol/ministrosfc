<script setup lang="ts">
import { useHead, useRouter } from "nuxt/app";
const router = useRouter();
import { ref } from "vue";
import type { GameFormData } from "../../../components/pages/admin/games/GameForm.vue";
import GameForm from "../../../components/pages/admin/games/GameForm.vue";
import { toISOWithOffset, type GameCreatePayload } from "@ministrosfc/shared";
import { useGames } from "~/composables/useGames";

definePageMeta({
  layout: "admin",
  middleware: "auth",
  requiresAuth: true,
  requiresRole: "editor",
  pageTitle: "Crear Partido",
});
useHead({ title: "Schedule Game – Admin" });

const { createGame } = useGames();
const loading = ref(false);
const error = ref("");

async function handleSubmit(payload: GameFormData) {
  loading.value = true;

  try {
    const body: GameCreatePayload = {
      opponentTeamId: payload.opponentTeamId,
      date: toISOWithOffset(payload.date, payload.time),
      competitionType: payload.competitionType,
      playgroundId: payload.playgroundId ?? null,
      maxPlayers: Number.isNaN(payload.maxPlayers as any)
        ? null
        : (payload.maxPlayers ?? null),
      participants: payload.participants,
    };
    if (payload.tournamentId) body.tournamentId = payload.tournamentId;

    await createGame(body);

    await router.push("/admin/games");
  } catch (e: any) {
    error.value = e?.message ?? "No se pudo crear el partido.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div>
    <header class="mb-4">
      <UiBackButton to="/admin/games" label="Volver a Partidos" />
    </header>
    <div class="mb-4">
      <h2 class="text-lg font-bold text-gray-900 mb-6">Programar Partido</h2>
    </div>

    <GameForm
      submitLabel="Crear Partido"
      @submit="handleSubmit"
      :error="error"
      :loading="loading"
    />
  </div>
</template>
