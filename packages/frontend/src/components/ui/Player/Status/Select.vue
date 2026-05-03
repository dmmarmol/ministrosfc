<script setup lang="ts">
import type { SelectItem } from "#ui/types";
import { OPTION_FILTER_ALL, PlayerStatus } from "@ministrosfc/shared";

const props = withDefaults(
  defineProps<{
    modelValue?: PlayerStatus | typeof OPTION_FILTER_ALL;
    singlePlayer?: boolean;
    includeAll?: boolean;
  }>(),
  {
    modelValue: OPTION_FILTER_ALL,
    singlePlayer: false,
    includeAll: true,
  },
);

const emit = defineEmits<{
  (
    e: "update:modelValue",
    value: PlayerStatus | typeof OPTION_FILTER_ALL | undefined,
  ): void;
}>();

const optionAll: SelectItem = {
  value: OPTION_FILTER_ALL,
  label: "Todos los estados",
};
const statusItems: SelectItem[] = [
  {
    value: PlayerStatus.ACTIVE,
    label: props.singlePlayer ? "Activo" : "Activos",
  },
  {
    value: PlayerStatus.INACTIVE,
    label: props.singlePlayer ? "Inactivo" : "Inactivos",
  },
];
const items: SelectItem[] = props.includeAll
  ? [optionAll, ...statusItems]
  : statusItems;

function handleUpdate(value: unknown) {
  if (typeof value !== "string") {
    emit("update:modelValue", OPTION_FILTER_ALL);
    return;
  }

  if (value === OPTION_FILTER_ALL) {
    emit("update:modelValue", OPTION_FILTER_ALL);
    return;
  }

  if (Object.values(PlayerStatus).includes(value as PlayerStatus)) {
    emit("update:modelValue", value as PlayerStatus);
    return;
  }

  emit("update:modelValue", OPTION_FILTER_ALL);
}
</script>

<template>
  <USelect
    v-bind="$attrs"
    :model-value="props.modelValue"
    @update:model-value="handleUpdate"
    :items="items"
    :ui="{ content: 'min-w-fit' }"
  />
</template>
