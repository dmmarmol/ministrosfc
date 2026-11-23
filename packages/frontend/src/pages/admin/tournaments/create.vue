<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useHead } from "nuxt/app";
import { useTournaments } from "~/composables/useTournaments";
import TournamentForm, {
  type TournamentFormData,
} from "~/components/pages/admin/tournaments/TournamentForm.vue";
import { useQueryParams } from "~/composables/useQueryParams";
import { resolveReturnUrl } from "~/utils/returnUrl";

definePageMeta({
  layout: "admin",
  middleware: "auth",
  requiresAuth: true,
  requiresRole: "editor",
  pageTitle: "Crear Torneo",
});
useHead({ title: "Nuevo torneo – Administración" });

const { createTournament } = useTournaments();
const router = useRouter();
const queryParams = useQueryParams();

const saving = ref(false);
const error = ref("");

async function handleSubmit(payload: TournamentFormData) {
  saving.value = true;
  error.value = "";

  try {
    await createTournament(payload);

    await router.push(
      resolveReturnUrl(queryParams.get("returnUrl"), "/admin/tournaments"),
    );
  } catch (e: any) {
    error.value = e?.message ?? "No se pudo guardar el torneo.";
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="max-w-lg">
    <header class="mb-4">
      <UiBackButton to="/admin/tournaments" label="Volvé a torneos" />
    </header>

    <TournamentForm
      :loading="saving"
      :submit-label="saving ? 'Guardando...' : 'Guardá el torneo'"
      @submit="handleSubmit"
    />
  </div>
</template>
