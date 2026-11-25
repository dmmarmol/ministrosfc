<script setup lang="ts">
defineProps<{ label: string }>();
</script>

<template>
  <label class="block min-w-0">
    <span class="sheet-label">{{ label }}</span>
    <span class="mt-1 block"><slot /></span>
  </label>
</template>
