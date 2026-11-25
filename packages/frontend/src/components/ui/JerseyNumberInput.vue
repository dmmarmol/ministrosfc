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
    <label class="sheet-label flex flex-wrap items-baseline gap-x-2" for="jerseyNumberInput"
      >{{ props.label }}
      <span
        v-if="isTaken"
        class="sheet-error-text normal-case tracking-normal"
        data-testid="jersey-taken-error"
      >
        Este número ya está ocupado
      </span></label
    >
    <input
      id="jerseyNumberInput"
      :value="modelValue ?? ''"
      type="number"
      min="1"
      max="99"
      :disabled="disabled"
      class="sheet-field sheet-num mt-1"
      :aria-invalid="isTaken ? 'true' : undefined"
      @input="onInput"
    />
    <p
      v-if="availableRanges"
      class="mt-1 text-sm text-[var(--sheet-ink-soft)]"
      data-testid="jersey-available-hint"
    >
      Disponibles: {{ availableRanges }}
    </p>
  </div>
</template>
