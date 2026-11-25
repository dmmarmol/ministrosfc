<script setup lang="ts">
/**
 * Inked section band: title on the left, an optional count on the right.
 * `countLabel` is the noun read out after the number ("partidos").
 */
defineProps<{
  id?: string;
  count?: number | string;
  countLabel?: string;
}>();
</script>

<template>
  <h2
    :id="id"
    class="sheet-on-ink sheet-display flex items-baseline justify-between bg-[var(--sheet-ink)] px-3 py-2 text-4xl text-[var(--sheet-paper)]"
  >
    <slot />
    <span
      v-if="count !== undefined"
      class="sheet-num font-[var(--sheet-type)] text-base font-bold text-[var(--sheet-blue-on-ink)]"
      >{{ count
      }}<span v-if="countLabel" class="sr-only">{{ " " + countLabel }}</span></span
    >
  </h2>
</template>
