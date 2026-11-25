<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { Tournament } from "@ministrosfc/shared";
import TournamentForm, {
  type TournamentFormData,
} from "~/components/pages/admin/tournaments/TournamentForm.vue";
import { useTournaments } from "~/composables/useTournaments";
import PageLoading from "~/components/ui/PageLoading.vue";
import { useQueryParams } from "~/composables/useQueryParams";
import { resolveReturnUrl } from "~/utils/returnUrl";

definePageMeta({
  layout: "admin",
  middleware: "auth",
  requiresAuth: true,
  requiresRole: "editor",
  pageTitle: "Editar Torneo",
});

const route = useRoute();
const router = useRouter();
const queryParams = useQueryParams();
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
  saving.value = true;
  error.value = "";

  try {
    await updateTournament(tournamentId.value, payload);

    await router.push(
      resolveReturnUrl(queryParams.get("returnUrl"), "/admin/tournaments"),
    );
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
      <UiBackButton to="/admin/tournaments" label="Volvé a torneos" />
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
      :submit-label="saving ? 'Guardando...' : 'Guardá el torneo'"
      @submit="handleSubmit"
    />
  </div>
</template>
