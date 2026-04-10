<script setup lang="ts">
import UserRoleManager from "~/components/admin/UserRoleManager.vue";

definePageMeta({
  layout: "admin",
  middleware: "auth",
  requiresAuth: true,
  requiresRole: "editor",
});
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-base font-semibold text-gray-700">Usuarios</h2>
    </div>

    <UserRoleManager />
  </div>
</template>
