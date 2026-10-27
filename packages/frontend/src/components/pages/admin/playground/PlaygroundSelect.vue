<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { usePlaygrounds } from "~/composables/usePlaygrounds";
import type { SelectItem } from "#ui/types";

const props = defineProps<{
  modelValue: string | null;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: SelectItem | undefined): void;
}>();

const { playgrounds, loading, fetchPlaygrounds, createPlayground } =
  usePlaygrounds();

const options = computed<SelectItem[]>(() =>
  playgrounds.value.map((pg) => ({
    value: pg.id,
    // label: `${pg.name} — ${pg.address}`,
    label: `${pg.name}`,
    meta: pg,
  })),
);

onMounted(() => {
  fetchPlaygrounds();
});

async function onCreate(payload: string): Promise<void> {
  console.log("Payload recibido en onCreate:", payload);
  // const newPg = await createPlayground({
  //   name: payload.name as string,
  //   address: payload.address as string,
  // });

  return;
}

function handleUpdate(value: SelectItem | undefined) {
  if (typeof value === "string") {
    emit("update:modelValue", value);
    return;
  }
  if (value && typeof value === "object" && "value" in value) {
    emit("update:modelValue", value.value);
    return;
  }

  emit("update:modelValue", "");
  return;
}
</script>

<template>
  <USelectMenu
    id="playground-select"
    :model-value="modelValue"
    @update:model-value="handleUpdate"
    @create="onCreate"
    :items="options"
    :loading="loading"
    value-key="value"
    label-key="label"
    placeholder="Seleccionar cancha"
    :search-input="false"
    :clear="true"
    :ui="{ content: 'min-w-fit' }"
  />
</template>
