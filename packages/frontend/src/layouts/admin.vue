<script setup lang="ts">
import { useAuthStore } from "~/stores/auth";

const authStore = useAuthStore();
const route = useRoute();

const noPadding = computed(
  () => !!(route.meta as Record<string, unknown>).noPadding,
);

const pageTitle = computed(() => {
  return (route.meta.pageTitle as string) || "Dashboard";
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
          >Inicio</NuxtLink
        >
        <NuxtLink
          to="/admin/players"
          class="block px-3 py-2 rounded text-sm hover:bg-gray-700 transition-colors"
          active-class="bg-gray-700 text-brand"
          >Jugadores</NuxtLink
        >
        <NuxtLink
          to="/admin/games"
          class="block px-3 py-2 rounded text-sm hover:bg-gray-700 transition-colors"
          active-class="bg-gray-700 text-brand"
          >Partidos</NuxtLink
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
          >Equipos</NuxtLink
        >
        <NuxtLink
          to="/admin/tournaments"
          class="block px-3 py-2 rounded text-sm hover:bg-gray-700 transition-colors"
          active-class="bg-gray-700 text-brand"
          >Torneos</NuxtLink
        >
        <NuxtLink
          to="/admin/users"
          class="block px-3 py-2 rounded text-sm hover:bg-gray-700 transition-colors"
          active-class="bg-gray-700 text-brand"
          >Usuarios</NuxtLink
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
        <div class="flex flex-col text-right">
          <p class="text-sm text-gray-800">
            Bienvenido,
            <span
              >{{ authStore.user?.firstName }}
              {{ authStore.user?.lastName }}</span
            >
          </p>
          <p class="text-[12px] text-gray-500 capitalize">
            <strong>Rol:</strong> {{ authStore.user?.role?.toLowerCase() }}
          </p>
        </div>
      </header>
      <main class="flex-1 overflow-y-auto" :class="noPadding ? '' : 'p-6'">
        <slot />
      </main>
    </div>
  </div>
</template>
