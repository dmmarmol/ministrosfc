<script setup lang="ts">
import type { Tournament } from "@ministrosfc/shared";
import TournamentForm, {
  type TournamentFormData,
} from "~/components/pages/admin/tournaments/TournamentForm.vue";
import { useTournaments } from "~/composables/useTournaments";
import PageLoading from "~/components/ui/PageLoading.vue";

definePageMeta({
  layout: "admin",
  middleware: "auth",
  requiresAuth: true,
  requiresRole: "editor",
  pageTitle: "Editar Torneo",
});

const route = useRoute();
const router = useRouter();
const { fetchTournament, updateTournament } = useTournaments();

const tournamentId = computed(() => String(route.params.tournamentId));
const tournament = ref<Tournament | null>(null);
const loading = ref(false);
const saving = ref(false);
const error = ref("");

async function retrieveTournament() {
  loading.value = true;
  error.value = "";

  try {
    tournament.value = await fetchTournament(tournamentId.value);
  } catch (e: any) {
    error.value = e?.message ?? "No se pudo cargar el torneo.";
    tournament.value = null;
  } finally {
    loading.value = false;
  }
}

async function handleSubmit(payload: TournamentFormData) {
  debugger;
  saving.value = true;
  error.value = "";

  try {
    await updateTournament(tournamentId.value, payload);

    /** @TODO investigate why the $api call is excecuted and returns 200 but this debugger is never reached */
    debugger;
    await router.push("/admin/tournaments");
  } catch (e: any) {
    error.value = e?.message ?? "No se pudo guardar el torneo.";
  } finally {
    saving.value = false;
  }
}

await retrieveTournament();
</script>

<template>
  <div class="space-y-4">
    <header class="mb-4">
      <UiBackButton to="/admin/tournaments" label="Volver a Torneos" />
    </header>

    <PageLoading
      v-if="loading"
      :loading="loading"
      :data="tournament"
      loadingMessage="Cargando torneo…"
      emptyMessage="No se encontró el torneo solicitado."
    />

    <TournamentForm
      v-else
      :tournament="tournament"
      :loading="saving"
      :error="error"
      :submit-label="saving ? 'Guardando...' : 'Guardar torneo'"
      @submit="handleSubmit"
    />
  </div>
</template>
