<script setup lang="ts">
import { ref, reactive } from "vue";
import { usePlaygrounds } from "~/composables/usePlaygrounds";

definePageMeta({ layout: "admin", middleware: "auth" });
useHead({ title: "Nueva Cancha – Admin" });

const router = useRouter();
const { createPlayground } = usePlaygrounds();

const form = reactive({ name: "", address: "" });
const loading = ref(false);
const error = ref("");
const addressError = ref("");

async function submit() {
  error.value = "";
  addressError.value = "";
  loading.value = true;
  try {
    await createPlayground({ name: form.name, address: form.address });
    await router.push("/admin/playgrounds");
  } catch (e: unknown) {
    const err = e as { data?: { code?: string }; message?: string };
    if (err?.data?.code === "ADDRESS_NOT_FOUND") {
      addressError.value = "No se pudo geocodificar la dirección. Por favor, verifica el domicilio.";
    } else {
      error.value = (e instanceof Error ? e.message : null) ?? "Error al crear cancha.";
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
    <h2 class="text-lg font-bold text-gray-900 mb-6">Nueva Cancha</h2>

    <form class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4" @submit.prevent="submit">
      <div v-if="error" class="text-sm text-red-600 bg-red-50 rounded p-3">{{ error }}</div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Nombre <span class="text-red-500">*</span></label>
        <input
          v-model="form.name"
          type="text"
          required
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          placeholder="Ej: Cancha del Club Sportivo"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Dirección <span class="text-red-500">*</span></label>
        <input
          v-model="form.address"
          type="text"
          required
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          :class="{ 'border-red-400': addressError }"
          placeholder="Ej: Av. Corrientes 1234, Buenos Aires"
        />
        <p v-if="addressError" class="mt-1 text-xs text-red-600">{{ addressError }}</p>
      </div>

      <div class="flex gap-3 pt-2">
        <button
          type="submit"
          :disabled="loading"
          class="bg-brand text-gray-900 font-semibold text-sm px-5 py-2 rounded-lg hover:opacity-90 disabled:opacity-50"
        >
          {{ loading ? "Guardando…" : "Crear Cancha" }}
        </button>
        <NuxtLink to="/admin/playgrounds" class="text-sm text-gray-500 hover:text-brand py-2">
          Cancelar
        </NuxtLink>
      </div>
    </form>
  </div>
</template>
