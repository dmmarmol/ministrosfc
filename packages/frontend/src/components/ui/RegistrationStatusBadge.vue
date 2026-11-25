<script setup lang="ts">
import { RegistrationStatus } from "@ministrosfc/shared";
import type { BadgeProps } from "#ui/types";

const { t } = useI18n();

const props = defineProps<{
  status: RegistrationStatus;
}>();

const statusColorMap: Record<RegistrationStatus, BadgeProps["color"]> = {
  [RegistrationStatus.APPROVED]: "success",
  [RegistrationStatus.PENDING_APPROVAL]: "warning",
  [RegistrationStatus.DENIED]: "error",
} as const;

const statusLabelMap: Record<RegistrationStatus, string> = {
  [RegistrationStatus.APPROVED]: t("registrationStatusBadge.aprobado"),
  [RegistrationStatus.PENDING_APPROVAL]: t("registrationStatusBadge.pendiente"),
  [RegistrationStatus.DENIED]: t("registrationStatusBadge.rechazado"),
} as const;
</script>

<template>
  <UBadge :color="statusColorMap[props.status]" variant="outline">{{
    statusLabelMap[props.status] ?? props.status
  }}</UBadge>
</template>
