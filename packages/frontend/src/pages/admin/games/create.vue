<script setup lang="ts">
import { useHead, useRouter } from "nuxt/app";
import { onMounted, ref } from "vue";
import type { GameFormData } from "../../../components/pages/admin/games/GameForm.vue";
import GameForm from "../../../components/pages/admin/games/GameForm.vue";
import { toISOWithOffset, type GameCreatePayload } from "@ministrosfc/shared";
import { useGames } from "~/composables/useGames";
import { useQueryParams } from "~/composables/useQueryParams";
import { resolveReturnUrl } from "~/utils/returnUrl";
import {
  consumeGameCreationDraft,
  saveGameCreationDraft,
  type GameCreationDraft,
} from "~/utils/gameCreationDraft";

definePageMeta({
  layout: "admin",
  middleware: "auth",
  requiresAuth: true,
  requiresRole: "editor",
  pageTitle: "Crear Partido",
});
useHead({ title: "Programar partido – Administración" });

const { createGame } = useGames();
const router = useRouter();
const queryParams = useQueryParams();
const loading = ref(false);
const error = ref("");
const initialDraft = ref<GameCreationDraft | null>(null);

onMounted(() => {
  initialDraft.value = consumeGameCreationDraft();
});

async function handleCreateTeam(payload: GameFormData) {
  saveGameCreationDraft({
    ...payload,
    participantIds: payload.draftParticipantIds,
    returnUrl: initialDraft.value?.returnUrl ?? queryParams.get("returnUrl"),
  });
  await router.push(
    "/admin/teams/create?returnUrl=%2Fadmin%2Fgames%2Fcreate",
  );
}

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

    await router.push(
      resolveReturnUrl(
        initialDraft.value?.returnUrl ?? queryParams.get("returnUrl"),
        "/admin/games",
      ),
    );
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
      <UiBackButton to="/admin/games" label="Volvé a partidos" />
    </header>
    <div class="mb-4">
      <h2 class="text-lg font-bold text-gray-900 mb-6">Programar Partido</h2>
    </div>

    <GameForm
      :initial-draft="initialDraft"
      submitLabel="Crear Partido"
      @submit="handleSubmit"
      @create-team="handleCreateTeam"
      :error="error"
      :loading="loading"
    />
  </div>
</template>
