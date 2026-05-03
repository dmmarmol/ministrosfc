<script setup lang="ts">
import PlayerForm, {
  type PlayerFormData,
} from "~/components/pages/admin/players/PlayerForm.vue";

definePageMeta({
  layout: "admin",
  middleware: "auth",
  requiresAuth: true,
  requiresRole: "editor",
});
useHead({ title: "Add Player – Admin" });

const { $api } = useNuxtApp();
const router = useRouter();
const loading = ref(false);
const error = ref("");

async function onSubmit(data: PlayerFormData) {
  error.value = "";
  loading.value = true;
  try {
    await $api("/api/v1/players", { method: "POST", body: data });
    await router.push("/admin/players");
  } catch (e: any) {
    error.value = e?.message ?? "No se pudo crear el jugador.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="max-w-xl">
    <div class="mb-4">
      <UiBackButton to="/admin/players" label="Volver a Jugadores" />
    </div>
    <h2 class="text-lg font-bold text-gray-900 mb-6">Agregar Jugador</h2>
    <div class="form-wrapper relative">
      <PlayerForm @submit="onSubmit" />
      <div
        v-if="loading"
        class="absolute inset-0 z-10 bg-white/70 rounded-xl flex items-center justify-center"
        aria-live="polite"
        aria-busy="true"
      >
        <span class="text-sm text-gray-700 font-medium">Cargando...</span>
      </div>
      <p
        v-if="error"
        class="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2"
      >
        {{ error }}
      </p>
    </div>
  </div>
</template>
