<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue: boolean;
    label?: string;
    description?: string;
    id?: string;
  }>(),
  {
    label: "¿Eres jugador del equipo?",
    description: "Marcá esta opción si jugas o jugaste en el equipo",
    id: "isPlayer",
  },
);

defineEmits<{
  "update:modelValue": [value: boolean];
}>();
</script>

<template>
  <label
    :for="id"
    class="flex cursor-pointer items-start gap-3 border-[3px] border-[var(--sheet-ink)] bg-[var(--sheet-paper)] px-4 py-3"
  >
    <input
      :id="id"
      :checked="modelValue"
      type="checkbox"
      class="sheet-checkbox mt-0.5"
      @change="
        $emit('update:modelValue', ($event.target as HTMLInputElement).checked)
      "
    />
    <div>
      <span class="font-bold">{{ label }}</span>
      <p class="mt-0.5 text-sm text-[var(--sheet-ink-soft)]">{{ description }}</p>
    </div>
  </label>
</template>
