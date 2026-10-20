<script setup lang="ts">
import { ref, reactive } from "vue";
import { usePlaygrounds } from "~/composables/usePlaygrounds";
import AddressAutocompleteInput from "~/components/AddressAutocompleteInput.vue";
import type { AddressSuggestion } from "@ministrosfc/shared";

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

const form = reactive({
  name: "",
  address: "",
  latitude: null as number | null,
  longitude: null as number | null,
});
const loading = ref(false);
const error = ref("");
const addressError = ref("");

function onAddressSelect(suggestion: AddressSuggestion | null) {
  form.latitude = suggestion?.lat ?? null;
  form.longitude = suggestion?.lon ?? null;
}

async function submit() {
  error.value = "";
  addressError.value = "";
  loading.value = true;
  try {
    await createPlayground({
      name: form.name,
      address: form.address,
      ...(form.latitude != null && form.longitude != null
        ? { latitude: form.latitude, longitude: form.longitude }
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
    <NuxtLink
      to="/admin/playgrounds"
      class="text-sm text-gray-500 hover:text-brand mb-4 inline-block"
    >
      ← Volver a Canchas
    </NuxtLink>

    <div class="mb-4">
      <h2 class="text-lg font-bold text-gray-900 mb-6">Nueva Cancha</h2>
    </div>

    <PlaygroundForm
      :playground="null"
      submitLabel="Crear Cancha"
      :loading="loading"
      :error="error"
      @submit="submit"
      @error="error = $event"
      @address-error="addressError = $event"
    />
  </div>
</template>
