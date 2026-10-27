<script setup lang="ts">
import { UButton } from "#components";
import { useAuthStore } from "~/stores/auth";

const authStore = useAuthStore();
const open = ref(false);
const menuEl = ref<HTMLElement | null>(null);

function openMenu() {
  open.value = true;
}

function closeMenu() {
  open.value = false;
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
    <UButton
      variant="solid"
      color="primary"
      @click="openMenu"
      icon="mdi:chevron-down"
    >
      {{ authStore.fullName || "Admin" }}
    </UButton>

    <div
      v-if="open"
      class="absolute right-0 mt-1 bg-white rounded shadow-lg py-1 z-50 border border-gray-100"
    >
      <UButton
        v-if="authStore.isEditor"
        to="/admin/dashboard"
        variant="ghost"
        color="neutral"
        class="w-full"
        @click="closeMenu"
      >
        Panel
      </UButton>
      <UButton
        to="/profile"
        variant="ghost"
        color="neutral"
        class="w-full"
        @click="closeMenu"
      >
        Perfil de Usuario
      </UButton>
      <UButton
        :disabled="!authStore.user?.playerId"
        to="/profile/player"
        variant="ghost"
        color="neutral"
        class="w-full flex whitespace-nowrap"
        @click="closeMenu"
      >
        Perfil de Jugador
        <span v-if="!authStore.user?.playerId" class="text-xs"
          >(no vinculado)</span
        >
      </UButton>
      <hr class="my-1 border-gray-100" />
      <UButton to="/logout" variant="ghost" color="neutral" class="w-full">
        Cerrar sesión
      </UButton>
    </div>
  </div>
</template>
