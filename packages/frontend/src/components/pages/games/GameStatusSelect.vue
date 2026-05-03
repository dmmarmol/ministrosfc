<script setup lang="ts">
import type { SelectItem } from "#ui/types";
import { GameStatus, OPTION_FILTER_ALL } from "@ministrosfc/shared";

const props = withDefaults(
  defineProps<{
    modelValue?: GameStatus | typeof OPTION_FILTER_ALL;
    includeAll?: boolean;
  }>(),
  {
    modelValue: OPTION_FILTER_ALL,
    includeAll: true,
  },
);

const emit = defineEmits<{
  (
    e: "update:modelValue",
    value: GameStatus | typeof OPTION_FILTER_ALL | undefined,
  ): void;
}>();

const optionAll: SelectItem = {
  value: OPTION_FILTER_ALL,
  label: "Todos los estados",
};

const gameStatusItems: SelectItem[] = [
  { value: GameStatus.SCHEDULED, label: "Programado" },
  { value: GameStatus.COMPLETED, label: "Completado" },
  { value: GameStatus.CANCELLED, label: "Cancelado" },
];

const items: SelectItem[] = props.includeAll
  ? [optionAll, ...gameStatusItems]
  : gameStatusItems;

function handleUpdate(value: unknown) {
  if (typeof value === "string") {
    if (value === OPTION_FILTER_ALL && props.includeAll) {
      emit("update:modelValue", OPTION_FILTER_ALL);
      return;
    }

    if (Object.values(GameStatus).includes(value as GameStatus)) {
      emit("update:modelValue", value as GameStatus);
      return;
    }
  }

  emit("update:modelValue", props.includeAll ? OPTION_FILTER_ALL : undefined);
}
</script>
<template>
  <USelect
    v-bind="$attrs"
    :model-value="props.modelValue"
    @update:model-value="handleUpdate"
    :items="items"
    :ui="{ content: 'min-w-fit', base: 'justify-between' }"
  />
</template>
