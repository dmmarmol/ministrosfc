<script setup lang="ts">
import { es } from "@nuxt/ui/locale";
import { useAuthStore } from "~/stores/auth";

const authStore = useAuthStore();

// Set default page title
useHead({
  htmlAttrs: { lang: "es-AR" },
  title: "Ministros FC",
  titleTemplate: "%s | Ministros FC",
});

// Hydrate auth state from sessionStorage on client mount
onMounted(() => {
  authStore.loadFromStorage();
});
</script>

<template>
  <!-- Spanish locale: Nuxt UI's built-in texts (empty tables, close buttons, ...) -->
  <UApp :locale="es">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
