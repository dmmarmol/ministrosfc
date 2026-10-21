<script setup lang="ts">
import { ref, reactive } from "vue";
import { useOpponentTeams } from "~/composables/useOpponentTeams";
import TeamsForm, {
  type OpponentTeamFormData,
} from "~/components/pages/admin/teams/OpponentTeamForm.vue";
import type { AddressSuggestion } from "@ministrosfc/shared";

definePageMeta({
  layout: "admin",
  middleware: "auth",
  requiresAuth: true,
  requiresRole: "editor",
  pageTitle: "Crear Equipo",
});
useHead({ title: "Nuevo Equipo – Admin" });

const router = useRouter();
const { createOpponentTeam } = useOpponentTeams();

const loading = ref(false);
const error = ref("");

async function handleSubmit(payload: OpponentTeamFormData) {
  error.value = "";
  loading.value = true;
  try {
    await createOpponentTeam({
      name: payload.name,
      address: payload.address,
      ...(payload.latitude != null && payload.longitude != null
        ? { latitude: payload.latitude, longitude: payload.longitude }
        : {}),
    });
    await router.push("/admin/teams");
  } catch (e: unknown) {
    const err = e as { data?: { code?: string }; message?: string };
    error.value =
      (e instanceof Error ? e.message : null) ?? "Error al crear cancha.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="max-w-lg">
    <header class="mb-4">
      <UiBackButton to="/admin/teams" label="Volver a Equipos" />
    </header>

    <div class="mb-4">
      <h2 class="text-lg font-bold text-gray-900 mb-6">Nuevo Equipo</h2>
    </div>

    <TeamsForm
      :opponentTeam="null"
      submitLabel="Crear Equipo"
      :loading="loading"
      :error="error"
      @submit="handleSubmit"
      @error="error = $event"
    />
  </div>
</template>
