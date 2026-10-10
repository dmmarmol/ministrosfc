<script setup lang="ts">
import { computed } from "vue";
import { formatAvailableRanges } from "@ministrosfc/shared";

const props = withDefaults(
  defineProps<{
    modelValue: number | null;
    takenNumbers: number[];
    label?: string;
    disabled?: boolean;
  }>(),
  { disabled: false, label: "Dorsal #" },
);

const emit = defineEmits<{
  "update:modelValue": [value: number | null];
}>();

const isTaken = computed(
  () =>
    props.modelValue !== null &&
    props.modelValue !== undefined &&
    props.takenNumbers.includes(props.modelValue),
);

const availableRanges = computed(() =>
  formatAvailableRanges(props.takenNumbers),
);

function onInput(event: Event) {
  const raw = (event.target as HTMLInputElement).value;
  const parsed = raw === "" ? null : Number(raw);
  emit("update:modelValue", parsed);
}
</script>

<template>
  <div>
    <label
      class="flex gap-x-2 items-baseline text-xs font-medium text-gray-700 mb-1"
      for="jerseyNumberInput"
      >{{ props.label }}
      <p
        v-if="isTaken"
        class="text-xs text-error-500"
        data-testid="jersey-taken-error"
      >
        Este número ya está ocupado
      </p></label
    >
    <UInput
      id="jerseyNumberInput"
      :value="modelValue ?? ''"
      type="number"
      min="1"
      max="99"
      :disabled="disabled"
      :class="[
        'w-full',
        isTaken
          ? 'border-red-400 focus:ring-red-300'
          : 'border-gray-300 focus:ring-brand/50',
      ]"
      @input="onInput"
    />
    <p
      v-if="availableRanges"
      class="text-xs text-gray-400 mt-1"
      data-testid="jersey-available-hint"
    >
      Disponibles: {{ availableRanges }}
    </p>
  </div>
</template>
