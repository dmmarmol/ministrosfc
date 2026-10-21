<script setup lang="ts">
import { useHead, useRouter } from "nuxt/app";
const router = useRouter();
import { ref } from "vue";
import type { GameFormData } from "../../../components/pages/admin/games/GameForm.vue";
import GameForm from "../../../components/pages/admin/games/GameForm.vue";

definePageMeta({
  layout: "admin",
  middleware: "auth",
  requiresAuth: true,
  requiresRole: "editor",
  pageTitle: "Crear Partido",
});
useHead({ title: "Schedule Game – Admin" });

const { createGame } = useGames();

async function handleSubmit(payload: GameFormData) {
  debugger;
  const saving = ref(false);
  const error = ref("");
  saving.value = true;

  try {
    await createGame(payload);

    await router.push("/admin/games");
  } catch (e: any) {
    error.value = e?.message ?? "No se pudo guardar el partido.";
  } finally {
    saving.value = false;
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

    <GameForm submitLabel="Crear Partido" @submit="handleSubmit" />
  </div>
</template>
