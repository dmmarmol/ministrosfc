<script setup lang="ts">
import type { SelectItem } from "#ui/types";
import { OPTION_FILTER_ALL, UserRole } from "@ministrosfc/shared";
import { resolveSelectedValue } from "~/utils/object";

type Props = {
  modelValue?: UserRole | typeof OPTION_FILTER_ALL;
  includeAll?: boolean;
  /** Display wording in singular form */
  singular?: boolean;
};

const props = withDefaults(defineProps<Props>(), {
  modelValue: OPTION_FILTER_ALL,
  includeAll: false,
  singular: false,
});

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
    label: props.singular ? "Admin" : "Admins",
  },
  {
    value: UserRole.EDITOR,
    label: props.singular ? "Editor" : "Editores",
  },
  {
    value: UserRole.DT,
    label: props.singular ? "DT" : "DTs",
  },
  {
    value: UserRole.PLAYER,
    label: props.singular ? "Jugador" : "Jugadores",
  },
];
const items: SelectItem[] = props.includeAll
  ? [optionAll, ...statusItems]
  : statusItems;

const shouldShowOptionAll = computed(() => props.includeAll && false);

const normalizedItems = computed<SelectItem[]>(() =>
  shouldShowOptionAll.value ? items : statusItems,
);

const selectModelValue = computed(() => {
  if (!shouldShowOptionAll.value && props.modelValue === OPTION_FILTER_ALL) {
    return undefined;
  }
  return props.modelValue;
});

function emitClearedValue() {
  emit("update:modelValue", props.includeAll ? OPTION_FILTER_ALL : undefined);
}

function handleUpdate(value: unknown) {
  const selectedValue = resolveSelectedValue(value);

  if (!selectedValue) {
    emitClearedValue();
    return;
  }

  if (selectedValue === OPTION_FILTER_ALL && props.includeAll) {
    emit("update:modelValue", OPTION_FILTER_ALL);
    return;
  }

  if (Object.values(UserRole).includes(selectedValue as UserRole)) {
    emit("update:modelValue", selectedValue as UserRole);
    return;
  }

  emitClearedValue();
}
</script>
<template>
  <USelectMenu
    v-bind="$attrs"
    :model-value="selectModelValue"
    @update:model-value="handleUpdate"
    @clear="emitClearedValue"
    :clear="props.includeAll || undefined"
    :items="normalizedItems"
    value-key="value"
    label-key="label"
    :search-input="false"
    placeholder="Todos los roles"
    :ui="{ content: 'min-w-fit' }"
  />
</template>
