<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { usePlaygrounds } from "~/composables/usePlaygrounds";
import AddressAutocompleteInput from "~/components/AddressAutocompleteInput.vue";
import type { AddressSuggestion } from "@ministrosfc/shared";

definePageMeta({ layout: "admin", middleware: "auth" });

const router = useRouter();
const route = useRoute();
const id = route.params.id as string;

const { updatePlayground } = usePlaygrounds();
const { $api } = useNuxtApp();

const form = reactive({ name: "", address: "", latitude: null as number | null, longitude: null as number | null });
const loading = ref(false);
const fetching = ref(true);
const error = ref("");
const addressError = ref("");

useHead({ title: "Editar Cancha – Admin" });

function onAddressSelect(suggestion: AddressSuggestion | null) {
  form.latitude = suggestion?.lat ?? null;
  form.longitude = suggestion?.lon ?? null;
}

onMounted(async () => {
  try {
    const res = await $api<{ data: any }>(`/api/v1/playgrounds/${id}`);
    const pg = res.data;
    form.name = pg.name ?? "";
    form.address = pg.address ?? "";
    form.latitude = pg.latitude ?? null;
    form.longitude = pg.longitude ?? null;
  } catch {
    error.value = "No se pudo cargar la cancha.";
  } finally {
    fetching.value = false;
  }
});

async function submit() {
  error.value = "";
  addressError.value = "";
  loading.value = true;
  try {
    await updatePlayground(id, {
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
      addressError.value = "No se pudo geocodificar la dirección. Por favor, verifica el domicilio.";
    } else {
      error.value = (e instanceof Error ? e.message : null) ?? "Error al guardar cambios.";
    }
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="max-w-lg">
    <NuxtLink to="/admin/playgrounds" class="text-sm text-gray-500 hover:text-brand mb-4 inline-block">
      ← Volver a Canchas
    </NuxtLink>
    <h2 class="text-lg font-bold text-gray-900 mb-6">Editar Cancha</h2>

    <div v-if="fetching" class="text-sm text-gray-500">Cargando…</div>

    <form v-else class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4" @submit.prevent="submit">
      <div v-if="error" class="text-sm text-red-600 bg-red-50 rounded p-3">{{ error }}</div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Nombre <span class="text-red-500">*</span></label>
        <input
          v-model="form.name"
          type="text"
          required
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Dirección <span class="text-red-500">*</span></label>
        <AddressAutocompleteInput
          v-model="form.address"
          required
          :class="{ 'border-red-400': addressError }"
          @select="onAddressSelect"
        />
        <p v-if="addressError" class="mt-1 text-xs text-red-600">{{ addressError }}</p>
      </div>

      <div class="flex gap-3 pt-2">
        <button
          type="submit"
          :disabled="loading"
          class="bg-brand text-gray-900 font-semibold text-sm px-5 py-2 rounded-lg hover:opacity-90 disabled:opacity-50"
        >
          {{ loading ? "Guardando…" : "Guardar cambios" }}
        </button>
        <NuxtLink to="/admin/playgrounds" class="text-sm text-gray-500 hover:text-brand py-2">
          Cancelar
        </NuxtLink>
      </div>
    </form>
  </div>
</template>
