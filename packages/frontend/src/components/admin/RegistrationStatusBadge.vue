<script setup lang="ts">
import UiBadge from "../ui/Badge.vue";
import { RegistrationStatus } from "@ministrosfc/shared";

const props = defineProps<{
  status: RegistrationStatus;
}>();

function registrationStatusLabel(status: RegistrationStatus) {
  switch (status) {
    case RegistrationStatus.APPROVED:
      return "Aprobado";
    case RegistrationStatus.PENDING_APPROVAL:
      return "Pendiente";
    case RegistrationStatus.DENIED:
      return "Rechazado";
    default:
      return status;
  }
}

function registrationStatusBadgeVariant(
  status: RegistrationStatus,
): "soft" | "outline" | "subtle" | "ghost" {
  switch (status) {
    case RegistrationStatus.APPROVED:
      return "soft";
    case RegistrationStatus.PENDING_APPROVAL:
      return "outline";
    case RegistrationStatus.DENIED:
      return "subtle";
    default:
      return "ghost";
  }
}
</script>

<template>
  <UiBadge :variant="registrationStatusBadgeVariant(props.status)">
    {{ registrationStatusLabel(props.status) }}
  </UiBadge>
</template>
