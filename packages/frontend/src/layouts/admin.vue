<script setup lang="ts">
import { useAuthStore } from "~/stores/auth";

const authStore = useAuthStore();
const route = useRoute();

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
    <aside class="w-64 bg-gray-900 text-white flex flex-col">
      <div class="p-4 border-b border-gray-700">
        <span class="text-brand font-bold text-lg">Ministros FC</span>
        <p class="text-xs text-gray-400 mt-1">Admin Panel</p>
      </div>
      <nav class="flex-1 p-4 space-y-1">
        <NuxtLink
          to="/admin/dashboard"
          class="block px-3 py-2 rounded text-sm hover:bg-gray-700 transition-colors"
          active-class="bg-gray-700 text-brand"
          >Dashboard</NuxtLink
        >
        <NuxtLink
          to="/admin/players"
          class="block px-3 py-2 rounded text-sm hover:bg-gray-700 transition-colors"
          active-class="bg-gray-700 text-brand"
          >Players</NuxtLink
        >
        <NuxtLink
          to="/admin/games"
          class="block px-3 py-2 rounded text-sm hover:bg-gray-700 transition-colors"
          active-class="bg-gray-700 text-brand"
          >Games</NuxtLink
        >
        <NuxtLink
          to="/admin/playgrounds"
          class="block px-3 py-2 rounded text-sm hover:bg-gray-700 transition-colors"
          active-class="bg-gray-700 text-brand"
          >Canchas</NuxtLink
        >
        <NuxtLink
          to="/admin/teams"
          class="block px-3 py-2 rounded text-sm hover:bg-gray-700 transition-colors"
          active-class="bg-gray-700 text-brand"
          >Teams</NuxtLink
        >
        <NuxtLink
          to="/admin/tournaments"
          class="block px-3 py-2 rounded text-sm hover:bg-gray-700 transition-colors"
          active-class="bg-gray-700 text-brand"
          >Tournaments</NuxtLink
        >
      </nav>
      <!-- User info + logout -->
      <div class="p-4 border-t border-gray-700">
        <p class="text-xs text-gray-400 truncate mb-2">
          {{ authStore.user?.firstName }} {{ authStore.user?.lastName }}
        </p>
        <NuxtLink
          to="/"
          class="inline-block text-xs text-brand hover:opacity-90 transition-opacity mb-2"
        >
          Volver al sitio publico
        </NuxtLink>
        <br />
        <button
          class="text-xs text-red-400 hover:text-red-300 transition-colors"
          @click="authStore.logout()"
        >
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
      <main class="flex-1 overflow-y-auto p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
