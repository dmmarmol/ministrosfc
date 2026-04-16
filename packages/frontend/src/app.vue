<script setup lang="ts">
import { useAuthStore } from "~/stores/auth";

const authStore = useAuthStore();

// Set default page title
useHead({
  title: "Ministros FC",
  titleTemplate: "%s | Ministros FC",
});

// Hydrate auth state from sessionStorage on client mount
onMounted(() => {
  authStore.loadFromStorage();
});
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
