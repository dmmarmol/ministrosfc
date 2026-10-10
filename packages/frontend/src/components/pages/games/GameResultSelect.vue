<script setup lang="ts">
import type { SelectItem } from "#ui/types";
import { GameResult, OPTION_FILTER_ALL } from "@ministrosfc/shared";
import { resolveSelectedValue } from "~/utils/object";

const props = withDefaults(
  defineProps<{
    modelValue?: GameResult | typeof OPTION_FILTER_ALL;
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
    value: GameResult | typeof OPTION_FILTER_ALL | undefined,
  ): void;
}>();

const optionAll: SelectItem = {
  value: OPTION_FILTER_ALL,
  label: "Todos los resultados",
};

const gameResultItems: SelectItem[] = [
  { value: GameResult.WIN, label: "Victoria" },
  { value: GameResult.LOSS, label: "Derrota" },
  { value: GameResult.DRAW, label: "Empate" },
];

const items: SelectItem[] = props.includeAll
  ? [optionAll, ...gameResultItems]
  : gameResultItems;

function handleUpdate(value: unknown) {
  const selectedValue = resolveSelectedValue(value);

  if (selectedValue) {
    if (selectedValue === OPTION_FILTER_ALL && props.includeAll) {
      emit("update:modelValue", OPTION_FILTER_ALL);
      return;
    }

    if (Object.values(GameResult).includes(selectedValue as GameResult)) {
      emit("update:modelValue", selectedValue as GameResult);
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
