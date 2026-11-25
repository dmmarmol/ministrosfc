<script setup lang="ts">
import type { SelectItem } from "#ui/types";
import { GameResult, OPTION_FILTER_ALL } from "@ministrosfc/shared";
import { resolveSelectedValue } from "~/utils/object";

const { t } = useI18n();

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
  label: t("gamesGameResultSelect.todosLosResultados"),
};

const gameResultItems: SelectItem[] = [
  { value: GameResult.WIN, label: t("common.victoria") },
  { value: GameResult.LOSS, label: t("common.derrota") },
  { value: GameResult.DRAW, label: t("common.empate") },
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
