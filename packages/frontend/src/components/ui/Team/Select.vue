<script setup lang="ts">
import type { SelectItem } from "#ui/types";
import { OPTION_FILTER_ALL } from "@ministrosfc/shared";
import { useOpponentTeams } from "~/composables/useOpponentTeams";
import { resolveSelectedValue } from "~/utils/object";

const { t } = useI18n();

const props = withDefaults(
  defineProps<{
    modelValue?: string | typeof OPTION_FILTER_ALL;
    includeAll?: boolean;
    placeholder?: string;
  }>(),
  {
    modelValue: OPTION_FILTER_ALL,
    includeAll: true,
  },
);

const placeholder = computed(
  () => props.placeholder ?? t("teamSelect.elegiUnEquipo"),
);

const emit = defineEmits<{
  (
    e: "update:modelValue",
    value: string | typeof OPTION_FILTER_ALL | undefined,
  ): void;
}>();

const { $api } = useNuxtApp();
const { opponentTeams, fetchOpponentTeams } = useOpponentTeams();
onMounted(async () => {
  fetchOpponentTeams();
});
const teams = computed(() => opponentTeams.value ?? []);

const optionAll: SelectItem = {
  value: OPTION_FILTER_ALL,
  label: t("teamSelect.todosLosEquipos"),
};
const teamsItems = computed<SelectItem[]>(() =>
  teams.value.map((team) => ({
    value: team.id,
    label: team.name,
  })),
);

const shouldShowOptionAll = computed(() => props.includeAll && false);

const items = computed<SelectItem[]>(() =>
  shouldShowOptionAll.value
    ? [optionAll, ...teamsItems.value]
    : teamsItems.value,
);

const emptySelectionValue = computed<
  string | typeof OPTION_FILTER_ALL | undefined
>(() =>
  props.includeAll && shouldShowOptionAll.value ? OPTION_FILTER_ALL : undefined,
);

const selectModelValue = computed(() => {
  if (!shouldShowOptionAll.value && props.modelValue === OPTION_FILTER_ALL) {
    return undefined;
  }
  return props.modelValue;
});

function emitClearedValue() {
  emit("update:modelValue", emptySelectionValue.value);
}

function handleUpdate(value: unknown) {
  const selectedValue = resolveSelectedValue(value);

  if (!selectedValue) {
    emitClearedValue();
    return;
  }

  if (selectedValue === OPTION_FILTER_ALL && props.includeAll) {
    emit("update:modelValue", emptySelectionValue.value);
    return;
  }

  emit("update:modelValue", selectedValue);
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
    :placeholder="placeholder"
    value-key="value"
    label-key="label"
    :ui="{ content: 'min-w-fit' }"
    :search-input="{
      placeholder,
      icon: 'i-lucide-search',
    }"
  />
</template>
