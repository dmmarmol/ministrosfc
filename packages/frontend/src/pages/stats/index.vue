<script setup lang="ts">
definePageMeta({ middleware: "auth", requiresAuth: true });
await navigateTo("/stats/years", { replace: true });
</script>

<template>
  <div />
</template>
