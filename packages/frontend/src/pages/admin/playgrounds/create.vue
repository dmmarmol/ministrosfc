<script setup lang="ts">
import { ref, reactive } from "vue";
import { usePlaygrounds } from "~/composables/usePlaygrounds";
import AddressAutocompleteInput from "~/components/AddressAutocompleteInput.vue";
import type { AddressSuggestion } from "@ministrosfc/shared";
import type { PlaygroundFormData } from "~/components/pages/admin/playgrounds/PlaygroundForm.vue";

definePageMeta({
  layout: "admin",
  middleware: "auth",
  requiresAuth: true,
  requiresRole: "editor",
  pageTitle: "Crear Cancha",
});
useHead({ title: "Nueva Cancha – Admin" });

const router = useRouter();
const { createPlayground } = usePlaygrounds();

const loading = ref(false);
const error = ref("");
const addressError = ref("");

async function handleSubmit(payload: PlaygroundFormData) {
  error.value = "";
  addressError.value = "";
  loading.value = true;
  try {
    await createPlayground({
      name: payload.name,
      address: payload.address,
      ...(payload.latitude != null && payload.longitude != null
        ? { latitude: payload.latitude, longitude: payload.longitude }
        : {}),
    });
    await router.push("/admin/playgrounds");
  } catch (e: unknown) {
    const err = e as { data?: { code?: string }; message?: string };
    if (err?.data?.code === "ADDRESS_NOT_FOUND") {
      addressError.value =
        "No se pudo geocodificar la dirección. Por favor, verifica el domicilio.";
    } else {
      error.value =
        (e instanceof Error ? e.message : null) ?? "Error al crear cancha.";
    }
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="max-w-lg">
    <header class="mb-4">
      <UiBackButton to="/admin/playgrounds" label="Volver a Canchas" />
    </header>

    <div class="mb-4">
      <h2 class="text-lg font-bold text-gray-900 mb-6">Nueva Cancha</h2>
    </div>

    <PlaygroundForm
      :playground="null"
      submitLabel="Crear Cancha"
      :loading="loading"
      :error="error"
      @submit="handleSubmit"
      @error="error = $event"
      @address-error="addressError = $event"
    />
  </div>
</template>
