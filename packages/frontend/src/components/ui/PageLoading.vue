<template>
  <div v-if="loading" class="rounded-2xl border border-gray-200 bg-white p-6">
    <p class="text-sm text-gray-500">{{ loadingMessage }}</p>
  </div>

  <div
    v-else-if="!data"
    class="rounded-2xl border border-gray-200 bg-white p-6"
  >
    <p class="text-sm text-gray-500">{{ emptyMessage }}</p>
  </div>
</template>
<script setup lang="ts">
defineProps<{
  loading: boolean;
  data: any;
  loadingMessage: string;
  emptyMessage: string;
}>();
</script>
