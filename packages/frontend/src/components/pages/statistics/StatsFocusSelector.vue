<script setup lang="ts">
const props = defineProps<{
  modelValue: string;
}>();
const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const options = [
  { value: "years", label: "Todos los Años" },
  { value: "tournaments", label: "Todos los Torneos" },
  { value: "rivals", label: "Todos los Rivales" },
  { value: "rival", label: "Rival Específico" },
  { value: "players", label: "Todos los Jugadores" },
  { value: "player", label: "Jugador Específico" },
];
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      class="px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
      :class="
        modelValue === opt.value
          ? 'bg-brand text-white'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      "
      @click="emit('update:modelValue', opt.value)"
    >
      {{ opt.label }}
    </button>
  </div>
</template>
