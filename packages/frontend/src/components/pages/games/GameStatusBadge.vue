<script setup lang="ts">
import type { GameStatus } from "@ministrosfc/shared";
import type { BadgeProps } from "#ui/types";

const props = defineProps<{
  status: GameStatus;
}>();

const statusColorMap: Record<GameStatus, BadgeProps["color"]> = {
  SCHEDULED: "info",
  COMPLETED: "success",
  CANCELLED: "error",
  IN_PROGRESS: "warning",
} as const;

const statusLabelMap: Record<GameStatus, string> = {
  SCHEDULED: "Programado",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
  IN_PROGRESS: "En juego",
} as const;
</script>
<template>
  <UBadge :color="statusColorMap[props.status]">{{
    statusLabelMap[props.status] ?? props.status
  }}</UBadge>
</template>
