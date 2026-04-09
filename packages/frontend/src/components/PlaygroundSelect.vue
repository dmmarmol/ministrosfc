<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { usePlaygrounds } from "~/composables/usePlaygrounds";
import DropdownAddMore from "~/components/ui/DropdownAddMore.vue";
import type { DropdownOption } from "~/components/ui/DropdownAddMore.vue";

defineProps<{
  modelValue: string | null;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string | null): void;
}>();

const { playgrounds, loading, fetchPlaygrounds, createPlayground } =
  usePlaygrounds();

const options = computed<DropdownOption[]>(() =>
  playgrounds.value.map((pg) => ({
    id: pg.id,
    label: `${pg.name} — ${pg.address}`,
    meta: pg,
  })),
);

const inlineName = ref("");
const inlineAddress = ref("");

onMounted(() => {
  fetchPlaygrounds();
});

async function onCreate(
  payload: Record<string, unknown>,
): Promise<DropdownOption> {
  const newPg = await createPlayground({
    name: payload.name as string,
    address: payload.address as string,
  });
  return {
    id: newPg.id,
    label: `${newPg.name} — ${newPg.address}`,
    meta: newPg,
  };
}
</script>

<template>
  <DropdownAddMore
    :model-value="modelValue"
    :options="options"
    :loading="loading"
    :on-create="onCreate"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template #inline-create="{ submit, cancel, error, loading: creating }">
      <div class="p-3 space-y-2">
        <p class="text-xs font-semibold text-gray-600">Nueva cancha</p>
        <div v-if="error" class="text-xs text-red-600">{{ error }}</div>
        <form
          @submit.prevent="
            submit({ name: inlineName, address: inlineAddress });
            inlineName = '';
            inlineAddress = '';
          "
          class="space-y-2"
        >
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
              :disabled="creating"
              class="text-xs bg-brand text-gray-900 font-semibold px-3 py-1.5 rounded hover:opacity-90 disabled:opacity-50"
            >
              {{ creating ? "Guardando…" : "Crear" }}
            </button>
            <button
              type="button"
              class="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5"
              @click="cancel"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </template>
  </DropdownAddMore>
</template>
