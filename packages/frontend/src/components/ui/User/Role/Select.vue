<script setup lang="ts">
import type { SelectItem } from "#ui/types";
import { OPTION_FILTER_ALL, UserRole } from "@ministrosfc/shared";

const props = withDefaults(
  defineProps<{
    modelValue?: UserRole | typeof OPTION_FILTER_ALL;
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
    value: UserRole | typeof OPTION_FILTER_ALL | undefined,
  ): void;
}>();

const optionAll: SelectItem = {
  value: OPTION_FILTER_ALL,
  label: "Todos los roles",
};
const statusItems: SelectItem[] = [
  {
    value: UserRole.ADMIN,
    label: "Admins",
  },
  {
    value: UserRole.EDITOR,
    label: "Editors",
  },
  {
    value: UserRole.DT,
    label: "DTs",
  },
  {
    value: UserRole.PLAYER,
    label: "Players",
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

  if (Object.values(UserRole).includes(value as UserRole)) {
    emit("update:modelValue", value as UserRole);
    return;
  }

  emit("update:modelValue", OPTION_FILTER_ALL);
}
</script>
<template>
  <USelect
    v-bind="$attrs"
    v-model="props.modelValue"
    @update:model-value="handleUpdate"
    :items="items"
    :ui="{ content: 'min-w-fit' }"
  />
</template>
