<script setup lang="ts">
import {
  competitionTypeLabels,
  type CompetitionType,
} from "@ministrosfc/shared";

const { t } = useI18n();

const props = defineProps<{
  type?: CompetitionType | string | null;
}>();

const displayValue = computed(
  () =>
    competitionTypeLabels[props.type as CompetitionType] ?? t("tournamentCompetitionType.sinTipo"),
);
</script>

<template>
  <span>{{ displayValue }}</span>
</template>
