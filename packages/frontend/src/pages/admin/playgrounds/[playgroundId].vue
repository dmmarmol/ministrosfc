<script setup lang="ts">
import { ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import PlaygroundForm, {
  type PlaygroundFormData,
} from "~/components/pages/admin/playground/PlaygroundForm.vue";
import { usePlaygrounds } from "~/composables/usePlaygrounds";
import type { Playground } from "@ministrosfc/shared";
import { createTruthyObject } from "~/utils/object.js";
import { useQueryParams } from "~/composables/useQueryParams";
import { resolveReturnUrl } from "~/utils/returnUrl";

definePageMeta({
  layout: "admin",
  middleware: "auth",
  requiresAuth: true,
  requiresRole: "editor",
  pageTitle: "Editar Cancha",
});
useHead({ title: "Editar cancha – Administración" });

const route = useRoute();
const router = useRouter();
const queryParams = useQueryParams();
const playgroundId = computed(() => String(route.params.playgroundId));
const { fetchPlayground, updatePlayground } = usePlaygrounds();

const playground = ref<Playground | null>(null);
const loading = ref(false);
const error = ref("");

try {
  playground.value = await fetchPlayground(playgroundId.value);
} catch {
  error.value = "No se pudo cargar la cancha.";
}

async function handleSubmit(payload: PlaygroundFormData) {
  error.value = "";
  loading.value = true;
  try {
    const body: Partial<PlaygroundFormData> = createTruthyObject({
      name: payload.name,
      address: payload.address,
      latitude: payload.latitude,
      longitude: payload.longitude,
    });
    await updatePlayground(playgroundId.value, body);
    await router.push(
      resolveReturnUrl(queryParams.get("returnUrl"), "/admin/playgrounds"),
    );
  } catch (e: unknown) {
    const err = e as { data?: { code?: string }; message?: string };
    if (err?.data?.code === "ADDRESS_NOT_FOUND") {
      error.value =
        "No se pudo geocodificar la dirección. Por favor, verifica el domicilio.";
    } else {
      error.value =
        (e instanceof Error ? e.message : null) ?? "Error al guardar cambios.";
    }
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="max-w-lg">
    <header class="mb-4">
      <UiBackButton to="/admin/playgrounds" label="Volvé a canchas" />
    </header>

    <div class="mb-4">
      <h2 class="text-lg font-bold text-gray-900 mb-6">Editar Cancha</h2>
    </div>

    <PlaygroundForm
      :playground="playground"
      submitLabel="Guardá los cambios"
      :loading="loading"
      :error="error"
      @submit="handleSubmit"
    />
  </div>
</template>
