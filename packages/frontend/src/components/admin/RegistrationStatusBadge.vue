<script setup lang="ts">
import { RegistrationStatus } from "@ministrosfc/shared";
import type { BadgeProps } from "#ui/types";

const props = defineProps<{
  status: RegistrationStatus;
}>();

const statusColorMap: Record<RegistrationStatus, BadgeProps["color"]> = {
  [RegistrationStatus.APPROVED]: "success",
  [RegistrationStatus.PENDING_APPROVAL]: "warning",
  [RegistrationStatus.DENIED]: "error",
} as const;

const statusLabelMap: Record<RegistrationStatus, string> = {
  [RegistrationStatus.APPROVED]: "Aprobado",
  [RegistrationStatus.PENDING_APPROVAL]: "Pendiente",
  [RegistrationStatus.DENIED]: "Rechazado",
} as const;
</script>

<template>
  <UBadge :color="statusColorMap[props.status]">{{
    statusLabelMap[props.status] ?? props.status
  }}</UBadge>
</template>
