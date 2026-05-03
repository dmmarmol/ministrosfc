<script lang="ts" setup>
import type { SelectItem } from "#ui/types";
import {
  Position,
  PositionDisplayName,
  PLAYER_POSITION_FILTER_ALL,
} from "@ministrosfc/shared";

const props = withDefaults(
  defineProps<{
    modelValue?: Position | typeof PLAYER_POSITION_FILTER_ALL;
  }>(),
  {
    modelValue: PLAYER_POSITION_FILTER_ALL,
  },
);

const emit = defineEmits<{
  (
    e: "update:modelValue",
    value: Position | typeof PLAYER_POSITION_FILTER_ALL | undefined,
  ): void;
}>();

const positionItems: SelectItem[] = Object.values(Position).map((pos) => ({
  value: pos,
  label: PositionDisplayName[pos],
}));

const items: SelectItem[] = [
  {
    value: PLAYER_POSITION_FILTER_ALL,
    label: "Todas las posiciones",
  },
  ...positionItems,
];

function handleUpdate(value: unknown) {
  if (typeof value !== "string") {
    emit("update:modelValue", PLAYER_POSITION_FILTER_ALL);
    return;
  }

  if (value === PLAYER_POSITION_FILTER_ALL) {
    emit("update:modelValue", PLAYER_POSITION_FILTER_ALL);
    return;
  }

  if (Object.values(Position).includes(value as Position)) {
    emit("update:modelValue", value as Position);
    return;
  }

  emit("update:modelValue", PLAYER_POSITION_FILTER_ALL);
}
</script>
<template>
  <USelect
    :model-value="props.modelValue"
    @update:model-value="handleUpdate"
    class="border border-gray-300 rounded-lg px-3 py-2 text-sm w-48"
    :items="items"
  />
</template>
