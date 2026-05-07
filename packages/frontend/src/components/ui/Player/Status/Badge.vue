<script setup lang="ts">
import type { PlayerStatus } from "@ministrosfc/shared";
import type { BadgeProps } from "#ui/types";

const props = defineProps<{
  status: PlayerStatus;
}>();

const statusColorMap: Record<PlayerStatus, BadgeProps["color"]> = {
  ACTIVE: "success",
  INACTIVE: "neutral",
} as const;

const statusLabelMap: Record<PlayerStatus, string> = {
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
} as const;
</script>
<template>
  <UBadge :color="statusColorMap[props.status]">{{
    statusLabelMap[props.status] ?? props.status
  }}</UBadge>
</template>
