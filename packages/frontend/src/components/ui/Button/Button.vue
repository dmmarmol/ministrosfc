<script setup lang="ts">
import type { Button as UButtonProps, ButtonVariant } from "#ui/types";

type SupportedVariant = ButtonVariant;
type SupportedColors = "primary" | "secondary" | "tertiary" | "disabled";

type ButtonProps = {
  to?: string;
  variant?: SupportedVariant;
  color?: SupportedColors;
  type?: "button" | "submit" | "reset";
  disabled?: UButtonProps["disabled"];
};

const props = withDefaults(defineProps<ButtonProps>(), {
  variant: "solid",
  color: "primary",
  type: "button",
  disabled: false,
});

const baseClass = "rounded-lg px-3 py-2 text-sm";
const variantClasses: Record<SupportedVariant, string> = {
  solid: "border-0",
  soft: "border",
  outline: "border border-gray-300",
  ghost: "bg-transparent",
  link: "bg-transparent underline underline-offset-2",
};
const colorClasses: Record<SupportedColors, string> = {
  primary: "text-gray-700 dark:text-white bg-brand hover:bg-brand-dark",
  secondary: "text-white bg-secondary-200",
  tertiary: "bg-tertiary-500",
  disabled: "text-gray-400 bg-gray-100 cursor-not-allowed",
};
const buttonClasses = computed(() => {
  return `${baseClass} ${variantClasses[props.variant]} ${colorClasses[props.color]}`;
});
</script>
<template>
  <NuxtLink
    v-if="props.to"
    :to="props.to"
    :aria-disabled="props.disabled || undefined"
    :class="buttonClasses"
    :disabled="props.disabled"
  >
    <slot />
  </NuxtLink>
  <button
    v-else
    :type="props.type"
    :disabled="props.disabled"
    :class="buttonClasses"
  >
    <slot />
  </button>
</template>
