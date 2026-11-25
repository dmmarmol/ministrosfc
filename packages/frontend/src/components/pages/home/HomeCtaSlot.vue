<script setup lang="ts">
/**
 * Reserved slot for the signup call to action (spec 023 FR-021).
 * Not rendered today: HomeSheet only mounts it when `ctaEnabled` is true.
 * It sits in the empty line after the last convocado so enabling it moves nothing else.
 */
defineProps<{ to: string }>();
</script>

<template>
  <div class="mt-4 border-t-[3px] border-dashed border-[var(--sheet-blue)] pt-4">
    <NuxtLink
      :to="to"
      class="sheet-display block bg-[var(--sheet-ink)] px-4 py-3.5 text-center text-2xl text-[var(--sheet-paper)] no-underline hover:bg-[var(--sheet-ink-soft)]"
      >Anotarme</NuxtLink
    >
  </div>
</template>
