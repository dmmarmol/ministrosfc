<script setup lang="ts">
import { useAuthStore } from "~/stores/auth";
import AdminProfileMenu from "~/components/common/AdminProfileMenu.vue";

const authStore = useAuthStore();
const mobileOpen = ref(false);
</script>

<template>
  <nav class="bg-gray-900 text-white">
    <div
      class="container mx-auto px-4 max-w-7xl flex items-center justify-between h-12"
    >
      <!-- Desktop links -->
      <ul class="hidden md:flex items-center gap-6 text-sm font-medium">
        <li>
          <NuxtLink
            to="/"
            exact
            class="hover:text-brand transition-colors"
            active-class="text-brand"
            >Inicio</NuxtLink
          >
        </li>
        <li>
          <NuxtLink
            to="/roster"
            class="hover:text-brand transition-colors"
            active-class="text-brand"
            >Plantilla</NuxtLink
          >
        </li>
        <li>
          <NuxtLink
            to="/schedule"
            class="hover:text-brand transition-colors"
            active-class="text-brand"
            >Calendario</NuxtLink
          >
        </li>
        <li>
          <NuxtLink
            to="/tournaments"
            class="hover:text-brand transition-colors"
            active-class="text-brand"
            >Torneos</NuxtLink
          >
        </li>
        <li>
          <NuxtLink
            to="/statistics"
            class="hover:text-brand transition-colors"
            active-class="text-brand"
            >Estadísticas</NuxtLink
          >
        </li>
      </ul>
      <!-- Auth button -->
      <div class="flex items-center gap-3">
        <template v-if="authStore.isAuthenticated">
          <AdminProfileMenu v-if="authStore.isEditor" />
          <button
            v-else
            class="text-xs text-gray-400 hover:text-white transition-colors"
            @click="authStore.logout()"
          >
            Cerrar sesión
          </button>
        </template>
        <template v-else>
          <NuxtLink
            to="/login"
            class="text-xs bg-brand text-gray-900 font-semibold px-3 py-1.5 rounded hover:opacity-90 transition-opacity"
            >Iniciar sesión</NuxtLink
          >
        </template>
      </div>
      <!-- Mobile hamburger -->
      <button
        class="md:hidden p-2 text-gray-400 hover:text-white"
        @click="mobileOpen = !mobileOpen"
      >
        <span class="sr-only">Menu</span>
        <svg
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            v-if="!mobileOpen"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 6h16M4 12h16M4 18h16"
          />
          <path
            v-else
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
    <!-- Mobile menu -->
    <div
      v-if="mobileOpen"
      class="md:hidden bg-gray-800 px-4 pb-4 space-y-2 text-sm"
    >
      <NuxtLink
        to="/"
        exact
        class="block py-1.5 hover:text-brand"
        active-class="text-brand"
        @click="mobileOpen = false"
        >Inicio</NuxtLink
      >
      <NuxtLink
        to="/roster"
        class="block py-1.5 hover:text-brand"
        active-class="text-brand"
        @click="mobileOpen = false"
        >Plantilla</NuxtLink
      >
      <NuxtLink
        to="/schedule"
        class="block py-1.5 hover:text-brand"
        active-class="text-brand"
        @click="mobileOpen = false"
        >Calendario</NuxtLink
      >
      <NuxtLink
        to="/tournaments"
        class="block py-1.5 hover:text-brand"
        active-class="text-brand"
        @click="mobileOpen = false"
        >Torneos</NuxtLink
      >
      <NuxtLink
        to="/statistics"
        class="block py-1.5 hover:text-brand"
        active-class="text-brand"
        @click="mobileOpen = false"
        >Estadísticas</NuxtLink
      >
      <NuxtLink
        v-if="!authStore.isAuthenticated"
        to="/login"
        class="block py-1.5 text-brand"
        @click="mobileOpen = false"
        >Iniciar sesión</NuxtLink
      >
    </div>
  </nav>
</template>
