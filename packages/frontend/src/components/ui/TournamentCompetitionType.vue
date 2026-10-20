<script setup lang="ts">
import { CompetitionType } from "@ministrosfc/shared";
import { formatCompetitionType } from "~/utils/stats";

const props = defineProps<{
  type: CompetitionType;
}>();

const competitionTypeDisplayMap: Record<CompetitionType, string> = {
  [CompetitionType.FRIENDLY]: "Amistoso",
  [CompetitionType.LEAGUE]: "Liga",
  [CompetitionType.CUP]: "Copa",
  [CompetitionType.PLAYOFF]: "Playoff",
  [CompetitionType.SEASON]: "Temporada",
};

const displayValue = computed(() =>
  formatCompetitionType(competitionTypeDisplayMap[props.type]),
);
</script>

<template>
  <span>{{ displayValue }}</span>
</template>
