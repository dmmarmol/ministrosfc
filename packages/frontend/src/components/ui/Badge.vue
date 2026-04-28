<script setup lang="ts">
import { computed } from "vue";

type BadgeVariant = "solid" | "outline" | "soft" | "subtle" | "ghost" | "link";

const props = withDefaults(
  defineProps<{
    variant?: BadgeVariant;
  }>(),
  {
    variant: "soft",
  },
);

const baseClass = "inline-block px-2 py-0.5 rounded text-xs font-semibold";

const variantClasses: Record<BadgeVariant, string> = {
  solid: "bg-gray-900 text-white",
  outline: "border border-gray-300 text-gray-700",
  soft: "bg-gray-100 text-gray-700",
  subtle: "bg-gray-50 text-gray-600",
  ghost: "bg-transparent text-gray-700",
  link: "bg-transparent text-gray-700 underline underline-offset-2",
};

const badgeClass = computed(() => [baseClass, variantClasses[props.variant]]);
</script>

<template>
  <span :class="badgeClass">
    <slot />
  </span>
</template>
