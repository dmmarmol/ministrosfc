<script setup lang="ts">
import { ref, onMounted } from "vue";
import { usePlaygrounds } from "~/composables/usePlaygrounds";

const props = defineProps<{
  modelValue: string | null;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string | null): void;
}>();

const { playgrounds, fetchPlaygrounds, createPlayground } = usePlaygrounds();

const showInlineForm = ref(false);
const inlineName = ref("");
const inlineAddress = ref("");
const inlineLoading = ref(false);
const inlineError = ref("");

onMounted(() => {
  fetchPlaygrounds();
});

function onSelectChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value;
  if (value === "__add_new__") {
    showInlineForm.value = true;
    return;
  }
  showInlineForm.value = false;
  emit("update:modelValue", value === "" ? null : value);
}

async function submitInlineForm() {
  if (!inlineName.value || !inlineAddress.value) return;
  inlineLoading.value = true;
  inlineError.value = "";
  try {
    const newPg = await createPlayground({
      name: inlineName.value,
      address: inlineAddress.value,
    });
    showInlineForm.value = false;
    inlineName.value = "";
    inlineAddress.value = "";
    emit("update:modelValue", newPg.id);
  } catch {
    inlineError.value = "Error al crear cancha.";
  } finally {
    inlineLoading.value = false;
  }
}
</script>

<template>
  <div>
    <select
      :value="showInlineForm ? '__add_new__' : (modelValue ?? '')"
      class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
      @change="onSelectChange"
    >
      <option value="">-- Sin cancha --</option>
      <option
        v-for="pg in playgrounds"
        :key="pg.id"
        :value="pg.id"
      >{{ pg.name }} — {{ pg.address }}</option>
      <option value="__add_new__">Agregar nueva…</option>
    </select>

    <div v-if="showInlineForm" data-testid="inline-form" class="mt-3 p-4 border border-gray-200 rounded-lg bg-gray-50 space-y-3">
      <p class="text-xs font-semibold text-gray-600">Nueva cancha</p>
      <div v-if="inlineError" class="text-xs text-red-600">{{ inlineError }}</div>
      <form @submit.prevent="submitInlineForm" class="space-y-2">
        <input
          v-model="inlineName"
          type="text"
          required
          placeholder="Nombre"
          class="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
        />
        <input
          v-model="inlineAddress"
          type="text"
          required
          placeholder="Dirección"
          class="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
        />
        <div class="flex gap-2">
          <button
            type="submit"
            :disabled="inlineLoading"
            class="text-xs bg-brand text-gray-900 font-semibold px-3 py-1.5 rounded hover:opacity-90 disabled:opacity-50"
          >
            {{ inlineLoading ? "Guardando…" : "Crear" }}
          </button>
          <button
            type="button"
            class="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5"
            @click="showInlineForm = false; emit('update:modelValue', null)"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
