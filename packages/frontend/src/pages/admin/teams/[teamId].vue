<script setup lang="ts">
import type { OpponentTeam } from "@ministrosfc/shared";
import { useRoute, useRouter } from "vue-router";
import OpponentTeamForm from "~/components/pages/admin/teams/OpponentTeamForm.vue";
import PageLoading from "~/components/ui/PageLoading.vue";
import { useOpponentTeams } from "~/composables/useOpponentTeams";
import { useQueryParams } from "~/composables/useQueryParams";
import { resolveReturnUrl } from "~/utils/returnUrl";

definePageMeta({
  layout: "admin",
  middleware: "auth",
  requiresAuth: true,
  requiresRole: "editor",
  pageTitle: "Editar Equipo",
});

const route = useRoute();
const router = useRouter();
const queryParams = useQueryParams();
const { fetchOpponentTeam, updateOpponentTeam } = useOpponentTeams();

const teamId = computed(() => String(route.params.teamId));
const team = ref<OpponentTeam | null>(null);
const loading = ref(false);
const saving = ref(false);
const error = ref("");

async function retrieveTournament() {
  loading.value = true;
  error.value = "";

  try {
    team.value = await fetchOpponentTeam(teamId.value);
  } catch (e: any) {
    error.value = e?.message ?? "No se pudo cargar el equipo.";
    team.value = null;
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await retrieveTournament();
});

async function handleSubmit(payload: OpponentTeam) {
  saving.value = true;
  error.value = "";

  try {
    await updateOpponentTeam(teamId.value, payload);
    await router.push(
      resolveReturnUrl(queryParams.get("returnUrl"), "/admin/teams"),
    );
  } catch (e: any) {
    error.value = e?.message ?? "No se pudo guardar el equipo.";
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="space-y-4">
    <header class="mb-4">
      <UiBackButton to="/admin/teams" label="Volvé a equipos" />
    </header>

    <PageLoading
      v-if="loading"
      :loading="loading"
      :data="team"
      loadingMessage="Cargando equipo…"
      emptyMessage="No se encontró el equipo solicitado."
    />

    <OpponentTeamForm
      v-else
      :opponentTeam="team"
      :loading="saving"
      :error="error"
      :submit-label="saving ? 'Guardando...' : 'Guardá el equipo'"
      @submit="handleSubmit"
    />
  </div>
</template>
