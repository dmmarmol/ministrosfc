<script setup lang="ts">
import { computed } from "vue";
import type { GameStatus } from "@ministrosfc/shared";
import type { BadgeProps } from "#ui/types";

const props = defineProps<{
  status?: GameStatus | string | null;
}>();

const statusColorMap: Partial<Record<GameStatus, BadgeProps["color"]>> = {
  SCHEDULED: "info",
  COMPLETED: "success",
  CANCELLED: "error",
  IN_PROGRESS: "warning",
} as const;

const statusLabelMap: Partial<Record<GameStatus, string>> = {
  SCHEDULED: "Programado",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
  IN_PROGRESS: "En juego",
} as const;

const color = computed(
  () => statusColorMap[props.status as GameStatus] ?? "neutral",
);
const label = computed(
  () => statusLabelMap[props.status as GameStatus] ?? "Sin estado",
);
</script>
<template>
  <UBadge :color="color">{{ label }}</UBadge>
</template>
