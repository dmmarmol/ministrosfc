<script setup lang="ts">
import UserRoleManager from "~/components/admin/UserRoleManager.vue";

definePageMeta({
  layout: "admin",
  middleware: "auth",
  requiresAuth: true,
  requiresRole: "editor",
  pageTitle: "Usuarios",
});
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h2 class="text-base font-semibold text-gray-700">Usuarios</h2>
      <NuxtLink
        to="/admin/users/pending-approvals"
        class="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
      >
        Revisar aprobaciones pendientes
      </NuxtLink>
    </div>

    <UserRoleManager />
  </div>
</template>
