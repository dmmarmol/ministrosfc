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
    class="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 cursor-pointer"
  >
    <input
      :id="id"
      :checked="modelValue"
      type="checkbox"
      class="mt-0.5 h-5 w-5 rounded border-gray-300 text-brand focus:ring-brand/50"
      @change="
        $emit('update:modelValue', ($event.target as HTMLInputElement).checked)
      "
    />
    <div>
      <span class="text-sm font-medium text-gray-900">{{ label }}</span>
      <p class="text-xs text-gray-500 mt-0.5">{{ description }}</p>
    </div>
  </label>
</template>
