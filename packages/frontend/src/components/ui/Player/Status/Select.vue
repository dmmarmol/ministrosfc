<script setup lang="ts">
import type { SelectItem } from "#ui/types";
import { OPTION_FILTER_ALL, PlayerStatus } from "@ministrosfc/shared";
import { resolveSelectedValue } from "~/utils/object";


const { t } = useI18n();
const props = withDefaults(
  defineProps<{
    modelValue?: PlayerStatus | typeof OPTION_FILTER_ALL;
    singlePlayer?: boolean;
    includeAll?: boolean;
  }>(),
  {
    modelValue: OPTION_FILTER_ALL,
    singlePlayer: false,
    includeAll: false,
  },
);

const emit = defineEmits<{
  (
    e: "update:modelValue",
    value: PlayerStatus | typeof OPTION_FILTER_ALL | undefined,
  ): void;
  (
    e: "selected",
    value: PlayerStatus | typeof OPTION_FILTER_ALL | undefined,
  ): void;
}>();

const optionAll: SelectItem = {
  value: OPTION_FILTER_ALL,
  label: t("common.todosLosEstados"),
};
const statusItems: SelectItem[] = [
  {
    value: PlayerStatus.ACTIVE,
    label: props.singlePlayer ? t("common.activo") : t("common.activos"),
  },
  {
    value: PlayerStatus.INACTIVE,
    label: props.singlePlayer ? t("common.inactivo") : t("common.inactivos"),
  },
];

const items = computed<SelectItem[]>(() =>
  props.includeAll ? [optionAll, ...statusItems] : statusItems,
);

const selectModelValue = computed(() => {
  if (!props.includeAll && props.modelValue === OPTION_FILTER_ALL) {
    return undefined;
  }
  return props.modelValue;
});

function emitClearedValue() {
  const value = props.includeAll ? OPTION_FILTER_ALL : undefined;
  emit("update:modelValue", value);
  emit("selected", value);
}

function handleUpdate(value: unknown) {
  const selectedValue = resolveSelectedValue(value);

  if (!selectedValue) {
    emitClearedValue();
    return;
  }

  if (selectedValue === OPTION_FILTER_ALL && props.includeAll) {
    emit("update:modelValue", OPTION_FILTER_ALL);
    emit("selected", OPTION_FILTER_ALL);
    return;
  }

  if (Object.values(PlayerStatus).includes(selectedValue as PlayerStatus)) {
    emit("update:modelValue", selectedValue as PlayerStatus);
    emit("selected", selectedValue as PlayerStatus);
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
    :items="items"
    value-key="value"
    label-key="label"
    :search-input="false"
    :placeholder="t('common.todosLosEstados')"
    :ui="{ content: 'min-w-fit' }"
  />
</template>
