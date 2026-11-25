<script setup lang="ts">
/** Section heading (h2) with an optional blue count next to it. */
withDefaults(
  defineProps<{
    id?: string;
    size?: "md" | "lg";
    count?: number | string;
  }>(),
  { size: "md" },
);
</script>

<template>
  <h2
    :id="id"
    class="sheet-display flex items-baseline gap-3"
    :class="size === 'lg' ? 'text-4xl' : 'text-3xl'"
  >
    <slot />
    <span
      v-if="count !== undefined"
      class="sheet-num font-[var(--sheet-type)] text-base font-bold text-[var(--sheet-blue)]"
      >{{ count }}</span
    >
  </h2>
</template>
