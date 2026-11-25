<script setup lang="ts">
import { UButton } from "#components";
import { useAuthStore } from "~/stores/auth";

defineProps<{ sheet?: boolean }>();
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
  <div v-if="sheet" ref="menuEl" class="relative">
    <button
      type="button"
      class="sheet-chip inline-flex items-center gap-2"
      :aria-expanded="open"
      aria-haspopup="true"
      @click="open = !open"
    >
      {{ authStore.fullName || "Admin" }}
      <span aria-hidden="true">▾</span>
    </button>
    <ul
      v-if="open"
      class="absolute right-0 z-50 mt-1 min-w-48 border-[3px] border-[var(--sheet-ink)] bg-[var(--sheet-paper)]"
    >
      <li v-if="authStore.isEditor">
        <NuxtLink to="/admin/dashboard" class="block min-h-11 px-3 py-2.5 font-bold no-underline hover:bg-[var(--sheet-ground)]" @click="closeMenu">Panel</NuxtLink>
      </li>
      <li>
        <NuxtLink to="/profile" class="block min-h-11 px-3 py-2.5 font-bold no-underline hover:bg-[var(--sheet-ground)]" @click="closeMenu">Perfil de usuario</NuxtLink>
      </li>
      <li v-if="authStore.user?.playerId">
        <NuxtLink to="/profile/player" class="block min-h-11 px-3 py-2.5 font-bold no-underline hover:bg-[var(--sheet-ground)]" @click="closeMenu">Perfil de jugador</NuxtLink>
      </li>
      <li class="border-t-[3px] border-[var(--sheet-ink)]">
        <NuxtLink to="/logout" class="block min-h-11 px-3 py-2.5 font-bold no-underline hover:bg-[var(--sheet-ground)]">Cerrar sesión</NuxtLink>
      </li>
    </ul>
  </div>
  <div v-else ref="menuEl" class="relative">
    <UButton
      variant="solid"
      color="primary"
      @click="openMenu"
      icon="mdi:chevron-down"
    >
      {{ authStore.fullName || "Administrador" }}
    </UButton>

    <div
      v-if="open"
      class="absolute right-0 mt-1 bg-surface rounded shadow-lg py-1 z-50 border border-gray-100"
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
