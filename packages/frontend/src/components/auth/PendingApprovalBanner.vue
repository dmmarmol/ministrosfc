<script setup lang="ts">
defineProps<{
  message: string;
}>();
</script>

<template>
  <div class="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
    <p class="text-sm font-semibold text-amber-800">Solicitud enviada</p>
    <p class="mt-1 text-sm text-amber-700">
      {{ message }}
    </p>
  </div>
</template>
