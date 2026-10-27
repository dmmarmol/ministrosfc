<script setup lang="ts">
import { ref, reactive } from "vue";
import { useOpponentTeams } from "~/composables/useOpponentTeams";
import TeamsForm, {
  type OpponentTeamFormData,
} from "~/components/pages/admin/teams/OpponentTeamForm.vue";

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

async function handleSubmit(form: OpponentTeamFormData) {
  error.value = "";
  loading.value = true;
  try {
    await createOpponentTeam(form);
    await router.push("/admin/teams");
  } catch (e: unknown) {
    const err = e as { data?: { code?: string }; message?: string };
    error.value =
      (err instanceof Error ? err.message : null) ?? "Error al crear equipo.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div>
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
