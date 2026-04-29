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
      <UiButton
        to="/admin/users/pending-approvals"
        variant="solid"
        color="secondary"
      >
        Revisar aprobaciones pendientes
      </UiButton>
    </div>

    <UserRoleManager />
  </div>
</template>
