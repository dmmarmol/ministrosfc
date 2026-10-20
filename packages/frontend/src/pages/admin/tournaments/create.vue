<script setup lang="ts">
import { ref, reactive } from "vue";
import { useTournaments } from "~/composables/useTournaments";
import TournamentForm, {
  type TournamentFormData,
} from "~/components/pages/admin/tournaments/TournamentForm.vue";

definePageMeta({
  layout: "admin",
  middleware: "auth",
  requiresAuth: true,
  requiresRole: "editor",
  pageTitle: "Crear Torneo",
});
useHead({ title: "Nuevo Torneo – Admin" });

const { createTournament } = useTournaments();

const saving = ref(false);
const error = ref("");

async function handleSubmit(payload: TournamentFormData) {
  debugger;
  saving.value = true;
  error.value = "";

  try {
    await createTournament(payload);

    /** @TODO investigate why the $api call is excecuted and returns 200 but this debugger is never reached */
    debugger;
    await navigateTo("/admin/tournaments");
  } catch (e: any) {
    error.value = e?.message ?? "No se pudo guardar el torneo.";
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="max-w-lg">
    <UiBackButton to="/admin/tournaments" label="Volver a Torneos" />

    <TournamentForm
      :loading="saving"
      :submit-label="saving ? 'Guardando...' : 'Guardar torneo'"
      @submit="handleSubmit"
    />
  </div>
</template>
