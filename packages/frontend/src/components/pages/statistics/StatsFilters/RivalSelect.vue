<script setup lang="ts">
import type { SelectItem } from "#ui/types";
import { OPTION_FILTER_ALL } from "@ministrosfc/shared";
import { useStatisticsAvailableRivals } from "~/composables/useStatisticsAvailableRivals";

const props = withDefaults(
  defineProps<{
    modelValue?: string | typeof OPTION_FILTER_ALL;
    includeAll?: boolean;
  }>(),
  {
    modelValue: OPTION_FILTER_ALL,
    includeAll: false,
  },
);
const emit = defineEmits<{
  (
    e: "update:modelValue",
    value: string | typeof OPTION_FILTER_ALL | undefined,
  ): void;
}>();

const { availableRivals } = useStatisticsAvailableRivals();

const optionAll: SelectItem = {
  value: OPTION_FILTER_ALL,
  label: "Todos los rivales",
};
const items = computed<SelectItem[]>(() =>
  props.includeAll
    ? [optionAll, ...availableRivals.value]
    : availableRivals.value,
);
function handleUpdate(value: SelectItem | undefined) {
  if (typeof value === "string") {
    emit("update:modelValue", value);
    return;
  }
  if (value && typeof value === "object" && "value" in value) {
    emit("update:modelValue", value.value as string);
    return;
  }
  emit("update:modelValue", "");
  return;
}
</script>

<template>
  <USelectMenu
    v-bind="$attrs"
    :model-value="modelValue"
    @update:model-value="handleUpdate"
    :items="items"
    value-key="value"
    label-key="label"
    placeholder="Seleccionar rival"
    :search-input="true"
    :clear="true"
    :ui="{ content: 'min-w-fit' }"
  />
</template>
