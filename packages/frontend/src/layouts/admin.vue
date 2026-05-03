<script setup lang="ts">
import { useAuthStore } from "~/stores/auth";

const authStore = useAuthStore();
const route = useRoute();

const noPadding = computed(
  () => !!(route.meta as Record<string, unknown>).noPadding,
);

const pageTitle = computed(() => {
  const segments = route.path.split("/").filter(Boolean);
  const last = segments[segments.length - 1];
  if (!last || last === "admin") return "Dashboard";
  return last.charAt(0).toUpperCase() + last.slice(1);
});
</script>

<template>
  <div class="min-h-screen flex bg-gray-100">
    <!-- Sidebar -->
    <aside class="w-64 bg-admin-ui-sidebar-bg text-white flex flex-col">
      <div class="p-4 border-b border-gray-700">
        <span class="text-brand font-bold text-lg">Ministros FC</span>
        <p class="text-xs text-gray-400 mt-1">Admin Panel</p>
      </div>
      <nav class="flex-1 flex flex-col p-4 space-y-2">
        <UButton to="/admin/dashboard" variant="solid" color="secondary"
          >Inicio</UButton
        >
        <UButton to="/admin/players" variant="solid" color="secondary"
          >Jugadores</UButton
        >
        <UButton to="/admin/games" variant="solid" color="secondary"
          >Partidos</UButton
        >
        <UButton to="/admin/playgrounds" variant="solid" color="secondary"
          >Canchas</UButton
        >
        <UButton to="/admin/teams" variant="solid" color="secondary"
          >Equipos</UButton
        >
        <UButton to="/admin/tournaments" variant="solid" color="secondary"
          >Torneos</UButton
        >
        <UButton to="/admin/users" variant="solid" color="secondary"
          >Usuarios</UButton
        >
      </nav>
      <!-- User info + logout -->
      <div class="p-4 border-t border-gray-700">
        <p class="text-xs text-gray-400 truncate mb-2">
          <!-- @TODO add user icon from a library like Heroicons -->
          {{ authStore.user?.firstName }} {{ authStore.user?.lastName }}
        </p>
        <NuxtLink
          to="/"
          class="inline-block text-xs text-brand hover:opacity-90 transition-opacity mb-2"
        >
          <!-- @TODO add Home icon from a library like Heroicons -->
          Volver al sitio publico
        </NuxtLink>
        <br />
        <button
          class="text-xs text-red-400 hover:text-red-300 transition-colors"
          @click="authStore.logout()"
        >
          <!-- @TODO add Sign out icon from a library like Heroicons -->
          Sign out
        </button>
      </div>
    </aside>
    <!-- Main content -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <header
        class="bg-white shadow-sm px-6 py-4 flex items-center justify-between"
      >
        <h1 class="text-lg font-semibold text-gray-800">{{ pageTitle }}</h1>
        <span class="text-sm text-gray-500 capitalize">{{
          authStore.user?.role?.toLowerCase()
        }}</span>
      </header>
      <main class="flex-1 overflow-y-auto" :class="noPadding ? '' : 'p-6'">
        <slot />
      </main>
    </div>
  </div>
</template>
