<script setup lang="ts">
/** Loading or empty state line shown in place of a list. Spacing comes from the caller. */
withDefaults(defineProps<{ tone?: "loading" | "empty" }>(), { tone: "loading" });
</script>

<template>
  <p
    :class="tone === 'empty' && 'text-lg'"
    :role="tone === 'loading' ? 'status' : undefined"
  >
    <slot />
  </p>
</template>
