<script setup lang="ts">
import type { SelectItem } from "#ui/types";

const props = defineProps<{
  modelValue?: string;
  placeholder?: string;
}>();

const { availablePlayers: items } = useStatisticsAvailablePlayers();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

function handleUpdate(value: unknown) {
  if (typeof value === "string") {
    emit("update:modelValue", value);
  } else if (value && typeof value === "object" && "value" in value) {
    const inner = (value as { value?: unknown }).value;
    emit("update:modelValue", typeof inner === "string" ? inner : "");
  } else {
    emit("update:modelValue", "");
  }
}
</script>

<template>
  <USelect
    :model-value="modelValue"
    @update:model-value="handleUpdate"
    :items="items"
    :placeholder="placeholder"
    :ui="{ content: 'min-w-fit' }"
    :search-input="{
      placeholder: props.placeholder,
      icon: 'i-lucide-search',
    }"
  />
</template>
