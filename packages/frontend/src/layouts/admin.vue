<script setup lang="ts">
import { useAuthStore } from "~/stores/auth";

const authStore = useAuthStore();
const route = useRoute();
const openSlideover = ref(true);

const noPadding = computed(
  () => !!(route.meta as Record<string, unknown>).noPadding,
);

// const pageTitle = computed(() => {
//   return (route.meta.pageTitle as string) || "Dashboard";
// });
</script>

<template>
  <div class="min-h-screen flex bg-gray-100">
    <!-- Sidebar -->
    <USidebar
      v-model:open="openSlideover"
      collapsible="icon"
      :ui="{
        container: 'h-full',
        inner: 'bg-admin-ui-sidebar-bg text-white divide-transparent',
        body: 'py-0 w-64',
      }"
    >
      <template #default>
        <div class="p-4 pl-6 border-b border-gray-700">
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
          <p
            v-if="authStore.user"
            class="text-sm text-gray-400 truncate mb-2 pl-2"
          >
            {{ authStore.user?.firstName }} {{ authStore.user?.lastName }}
          </p>
          <div class="flex flex-col space-y-2">
            <UButton
              to="/profile"
              variant="link"
              color="white"
              size="xs"
              icon="mdi:account"
              class="w-full"
            >
              Perfil
            </UButton>
            <UButton
              to="/"
              variant="link"
              color="white"
              icon="mdi:home"
              size="xs"
              class="w-full"
            >
              Volver al sitio publico
            </UButton>
            <hr class="text-gray-600" />
            <UButton
              variant="link"
              color="error"
              size="xs"
              icon="mdi:logout"
              class="w-full"
              @click="authStore.logout()"
            >
              Desconectarse
            </UButton>
          </div>
        </div>
      </template>
    </USidebar>

    <!-- Main content -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <header
        class="bg-white shadow-sm px-6 py-4 flex items-center justify-end"
      >
        <!-- <h1 class="text-lg font-semibold text-gray-800">{{ pageTitle }}</h1> -->
        <div v-if="authStore.user" class="flex flex-col text-right">
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
