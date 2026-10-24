<script setup lang="ts">
import type { SelectItem } from "#ui/types";
import { OPTION_FILTER_ALL, type PlayerStatus } from "@ministrosfc/shared";

const props = defineProps<{
  modelValue: string | null;
  includeAll?: boolean;
  status: PlayerStatus | null;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: SelectItem | undefined): void;
}>();

const statusRef = computed(() => props.status);
const { availablePlayers } = useStatisticsAvailablePlayers(statusRef);

const optionAll: SelectItem = {
  value: OPTION_FILTER_ALL,
  label: "Todos los jugadores",
};
const items = computed<SelectItem[]>(() =>
  props.includeAll
    ? [optionAll, ...availablePlayers.value]
    : availablePlayers.value,
);

// Clear selected player when it is no longer present in the filtered list.
watch(availablePlayers, () => {
  if (!props.modelValue) return;
  if (
    !availablePlayers.value.some((p) => {
      const pValue = typeof p === "object" && "value" in p! ? p.value : p;
      return pValue === props.modelValue;
    })
  ) {
    emit("update:modelValue", undefined);
  }
});

function handleUpdate(value: SelectItem | undefined) {
  if (typeof value === "string") {
    emit("update:modelValue", value);
    return;
  }
  if (value && typeof value === "object" && "value" in value) {
    emit("update:modelValue", value.value);
    return;
  }

  emit("update:modelValue", "");
  return;
}
</script>

<template>
  <USelectMenu
    id="player-select"
    :model-value="modelValue"
    @update:model-value="handleUpdate"
    :items="items"
    value-key="value"
    label-key="label"
    placeholder="Seleccionar Jugador"
    :search-input="true"
    :clear="true"
    :ui="{ content: 'min-w-fit' }"
  />
</template>
