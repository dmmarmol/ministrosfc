<script setup lang="ts">
import type { SelectItem } from "#ui/types";
import { OPTION_FILTER_ALL } from "@ministrosfc/shared";
import { useStatisticsAvailableYears } from "~/composables/useStatisticsAvailableYears";

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

const { availableYears } = useStatisticsAvailableYears();

const optionAll: SelectItem = {
  value: OPTION_FILTER_ALL,
  label: "Todos los años",
};
const items = computed<SelectItem[]>(() =>
  props.includeAll
    ? [optionAll, ...availableYears.value]
    : availableYears.value,
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
    placeholder="Seleccionar año"
    :search-input="false"
    :clear="true"
    :ui="{ content: 'min-w-fit' }"
  />
</template>
