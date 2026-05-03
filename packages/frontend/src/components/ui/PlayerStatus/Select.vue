<script setup lang="ts">
import type { SelectItem } from "#ui/types";
import { PLAYER_STATUS_FILTER_ALL, PlayerStatus } from "@ministrosfc/shared";

const model = defineModel<string>({ default: PlayerStatus.ACTIVE });
const props = withDefaults(
  defineProps<{
    modelValue?: PlayerStatus | typeof PLAYER_STATUS_FILTER_ALL;
  }>(),
  {
    modelValue: PLAYER_STATUS_FILTER_ALL,
  },
);

const emit = defineEmits<{
  (
    e: "update:modelValue",
    value: PlayerStatus | typeof PLAYER_STATUS_FILTER_ALL | undefined,
  ): void;
}>();

const items: SelectItem[] = [
  {
    value: PLAYER_STATUS_FILTER_ALL,
    label: "Todos los estados",
  },
  {
    value: PlayerStatus.ACTIVE,
    label: "Activos",
  },
  {
    value: PlayerStatus.INACTIVE,
    label: "Inactivos",
  },
];

function handleUpdate(value: unknown) {
  if (typeof value !== "string") {
    emit("update:modelValue", PLAYER_STATUS_FILTER_ALL);
    return;
  }

  if (value === PLAYER_STATUS_FILTER_ALL) {
    emit("update:modelValue", PLAYER_STATUS_FILTER_ALL);
    return;
  }

  if (Object.values(PlayerStatus).includes(value as PlayerStatus)) {
    emit("update:modelValue", value as PlayerStatus);
    return;
  }

  emit("update:modelValue", PLAYER_STATUS_FILTER_ALL);
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
