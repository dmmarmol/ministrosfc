<script setup lang="ts">
const { t } = useI18n();
</script>
<template>
  <div
    class="absolute inset-0 z-10 bg-sheet-paper/70 rounded-xl flex items-center justify-center"
    aria-live="polite"
    aria-busy="true"
  >
    <span class="text-sm text-gray-700 font-medium"
      ><slot>{{ t("loadingOverlay.guardando") }}</slot></span
    >
  </div>
</template>
