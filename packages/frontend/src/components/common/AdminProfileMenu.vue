<script setup lang="ts">
import { useAuthStore } from "~/stores/auth";

const authStore = useAuthStore();
const open = ref(false);
const menuEl = ref<HTMLElement | null>(null);

function handleLogout() {
  open.value = false;
  authStore.logout();
}

function handleClickOutside(e: MouseEvent) {
  if (menuEl.value && !menuEl.value.contains(e.target as Node)) {
    open.value = false;
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === "Escape") open.value = false;
}

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
  document.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
  document.removeEventListener("keydown", handleKeydown);
});
</script>

<template>
  <div ref="menuEl" class="relative">
    <button
      class="text-xs bg-brand text-gray-900 font-semibold px-3 py-1.5 rounded hover:opacity-90 transition-opacity flex items-center gap-1"
      @click="open = !open"
    >
      {{ authStore.fullName || "Admin" }}
      <svg
        class="w-3 h-3 transition-transform"
        :class="{ 'rotate-180': open }"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </button>

    <div
      v-if="open"
      class="absolute right-0 mt-1 w-52 bg-white rounded shadow-lg py-1 z-50 border border-gray-100"
    >
      <NuxtLink
        v-if="authStore.isEditor"
        to="/admin/dashboard"
        class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        @click="open = false"
      >
        Panel
      </NuxtLink>
      <NuxtLink
        v-if="authStore.user?.playerId"
        to="/profile/player"
        class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        @click="open = false"
      >
        Perfil de Jugador
      </NuxtLink>
      <div
        v-else
        class="flex flex-col gap-y-1 px-4 py-2 text-sm text-gray-400 cursor-not-allowed"
      >
        Perfil de Jugador
        <span class="text-xs">(no vinculado)</span>
      </div>
      <NuxtLink
        to="/profile"
        class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        @click="open = false"
      >
        Perfil de Usuario
      </NuxtLink>
      <hr class="my-1 border-gray-100" />
      <button
        class="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 transition-colors"
        @click="handleLogout"
      >
        Cerrar sesión
      </button>
    </div>
  </div>
</template>
