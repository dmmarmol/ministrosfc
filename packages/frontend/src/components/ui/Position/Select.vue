<script lang="ts" setup>
import type { SelectItem } from "#ui/types";
import {
  Position,
  PositionDisplayName,
  OPTION_FILTER_ALL,
} from "@ministrosfc/shared";
import { resolveSelectedValue } from "~/utils/object";
import Label from "./Label.vue";

const props = withDefaults(
  defineProps<{
    modelValue?: Position | typeof OPTION_FILTER_ALL;
    includeAll?: boolean;
    placeholder?: string;
  }>(),
  {
    modelValue: OPTION_FILTER_ALL,
    includeAll: true,
    placeholder: "Todas las posiciones",
  },
);

const emit = defineEmits<{
  (
    e: "update:modelValue",
    value: Position | typeof OPTION_FILTER_ALL | undefined,
  ): void;
}>();

const positionItems: SelectItem[] = Object.values(Position).map((pos) => ({
  value: pos,
  label: PositionDisplayName[pos],
}));

const optionAll: SelectItem = {
  value: OPTION_FILTER_ALL,
  label: "Todas las posiciones",
};
const shouldShowOptionAll = computed(() => props.includeAll && false);

const items = computed<SelectItem[]>(() =>
  shouldShowOptionAll.value ? [optionAll, ...positionItems] : positionItems,
);

const selectModelValue = computed(() => {
  if (!shouldShowOptionAll.value && props.modelValue === OPTION_FILTER_ALL) {
    return undefined;
  }
  return props.modelValue;
});

const positionValues = Object.values(Position) as Position[];

function isPositionValue(value: unknown): value is Position {
  return (
    typeof value === "string" && positionValues.includes(value as Position)
  );
}

function extractItemValue(item: unknown): unknown {
  if (item && typeof item === "object" && "value" in item) {
    return (item as { value?: unknown }).value;
  }
  return item;
}

function getItemPosition(item: unknown): Position | null {
  const value = extractItemValue(item);
  return isPositionValue(value) ? value : null;
}

function isAllItem(item: unknown): boolean {
  return extractItemValue(item) === OPTION_FILTER_ALL;
}

function getItemLabel(item: unknown): string {
  if (item && typeof item === "object" && "label" in item) {
    const label = (item as { label?: unknown }).label;
    if (typeof label === "string") {
      return label;
    }
  }

  const value = extractItemValue(item);
  if (value === OPTION_FILTER_ALL) {
    return "Todas las posiciones";
  }
  if (isPositionValue(value)) {
    return PositionDisplayName[value];
  }
  return "";
}

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

  if (isPositionValue(selectedValue)) {
    emit("update:modelValue", selectedValue);
    return;
  }

  emit("update:modelValue", props.includeAll ? OPTION_FILTER_ALL : undefined);
}
const selectedLabel = computed(() => {
  if (!props.modelValue || props.modelValue === OPTION_FILTER_ALL) {
    return undefined;
  }
  return isPositionValue(props.modelValue)
    ? PositionDisplayName[props.modelValue]
    : undefined;
});
</script>
<template>
  <USelectMenu
    v-bind="$attrs"
    :model-value="selectModelValue"
    @update:model-value="handleUpdate"
    @clear="emitClearedValue"
    :clear="props.includeAll || undefined"
    :items="items"
    value-key="value"
    label-key="label"
    :search-input="false"
    :placeholder="props.placeholder"
    :label="selectedLabel"
    :ui="{ content: 'min-w-fit', base: 'justify-between' }"
  >
    <template #item-leading="{ item }">
      <div
        v-if="!isAllItem(item) && getItemPosition(item)"
        class="flex items-center"
      >
        <Label :position="getItemPosition(item)!" />
      </div>
    </template>
    <template #item-label="{ item }">
      <div class="flex items-center py-1">
        <span class="truncate">{{ getItemLabel(item) }}</span>
      </div>
    </template>
  </USelectMenu>
</template>
