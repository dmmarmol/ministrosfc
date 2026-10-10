<script setup lang="ts">
import { UserRole } from "@ministrosfc/shared";
import type { BadgeProps } from "#ui/types";

const props = defineProps<{
  role: UserRole;
}>();

const roleColorMap: Record<UserRole, BadgeProps["color"]> = {
  [UserRole.ADMIN]: "primary",
  [UserRole.EDITOR]: "secondary",
  [UserRole.DT]: "neutral",
  [UserRole.PLAYER]: "neutral",
} as const;

const roleLabelMap: Record<UserRole, string> = {
  [UserRole.ADMIN]: "Administrador",
  [UserRole.DT]: "Director Técnico",
  [UserRole.EDITOR]: "Editor",
  [UserRole.PLAYER]: "Jugador",
} as const;
</script>

<template>
  <UBadge :color="roleColorMap[props.role]" variant="soft">{{
    roleLabelMap[props.role] ?? props.role
  }}</UBadge>
</template>
