<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';

const authStore = useAuthStore();

// Hydrate auth state from localStorage on client mount
onMounted(() => {
  authStore.loadFromStorage();
});
</script>
