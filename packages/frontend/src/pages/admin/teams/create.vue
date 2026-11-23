<script setup lang="ts">
import { ref } from "vue";
import { useQueryParams } from "~/composables/useQueryParams";
import { resolveReturnUrl } from "~/utils/returnUrl";
import { attachCreatedTeamToGameDraft } from "~/utils/gameCreationDraft";
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
useHead({ title: "Nuevo equipo – Administración" });

const router = useRouter();
const queryParams = useQueryParams();
const { createOpponentTeam } = useOpponentTeams();

const loading = ref(false);
const error = ref("");

async function handleSubmit(form: OpponentTeamFormData) {
  error.value = "";
  loading.value = true;
  try {
    const team = await createOpponentTeam(form);
    attachCreatedTeamToGameDraft(team.id);
    await router.push(
      resolveReturnUrl(queryParams.get("returnUrl"), "/admin/teams"),
    );
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
      <UiBackButton to="/admin/teams" label="Volvé a equipos" />
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
