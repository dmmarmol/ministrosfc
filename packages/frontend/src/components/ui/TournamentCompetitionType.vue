<script setup lang="ts">
import {
  competitionTypeLabels,
  type CompetitionType,
} from "@ministrosfc/shared";

const props = defineProps<{
  type?: CompetitionType | string | null;
}>();

const displayValue = computed(
  () =>
    competitionTypeLabels[props.type as CompetitionType] ?? "Sin tipo",
);
</script>

<template>
  <span>{{ displayValue }}</span>
</template>
