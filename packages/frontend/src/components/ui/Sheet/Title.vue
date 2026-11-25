<script setup lang="ts">
/** Page title (h1) in the sheet world's display type, fluid between sizes. */
withDefaults(defineProps<{ size?: "lg" | "md" | "sm" }>(), { size: "lg" });
</script>

<template>
  <h1
    class="sheet-display"
    :class="{
      'text-[clamp(3rem,15vw,6rem)]': size === 'lg',
      'text-[clamp(3rem,14vw,5rem)]': size === 'md',
      'text-[clamp(2.25rem,8vw,4rem)]': size === 'sm',
    }"
  >
    <slot />
  </h1>
</template>
