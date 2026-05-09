<script setup lang="ts">
import type { SelectItem } from "#ui/types";
import { OPTION_FILTER_ALL } from "@ministrosfc/shared";

type TournamentOption = SelectItem & {
  value: string;
  label: string;
};

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

const { availableTournaments } = useStatisticsAvailableTournaments();

const optionAll: TournamentOption = {
  value: OPTION_FILTER_ALL,
  label: "Todos los torneos",
};
const items = computed<TournamentOption[]>(() =>
  props.includeAll
    ? [optionAll, ...(availableTournaments.value as TournamentOption[])]
    : (availableTournaments.value as TournamentOption[]),
);

const selectedValue = computed(() => {
  if (!props.modelValue) {
    return undefined;
  }

  if (props.modelValue === OPTION_FILTER_ALL) {
    return props.includeAll ? OPTION_FILTER_ALL : undefined;
  }

  const byLabel = items.value.find((item) => item.label === props.modelValue);
  if (byLabel) {
    return byLabel.value as string;
  }

  const byValue = items.value.find((item) => item.value === props.modelValue);
  if (byValue) {
    return byValue.value as string;
  }

  return props.modelValue;
});

function handleUpdate(value: SelectItem | undefined) {
  if (typeof value === "string") {
    if (value === OPTION_FILTER_ALL) {
      emit("update:modelValue", props.includeAll ? OPTION_FILTER_ALL : "");
      return;
    }

    const selectedItem = items.value.find((item) => item.value === value);
    emit("update:modelValue", (selectedItem?.label as string) ?? value);
    return;
  }

  if (value && typeof value === "object" && "value" in value) {
    emit("update:modelValue", value.label as string);
    return;
  }

  emit("update:modelValue", "");
  return;
}
</script>

<template>
  <USelectMenu
    v-bind="$attrs"
    id="tournament-select"
    :model-value="selectedValue"
    @update:model-value="handleUpdate"
    :items="items"
    value-key="value"
    label-key="label"
    placeholder="Seleccionar torneo"
    :search-input="false"
    :clear="true"
    :ui="{ content: 'min-w-fit' }"
  />
</template>
