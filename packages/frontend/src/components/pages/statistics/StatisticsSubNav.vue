<script setup lang="ts">
import { useAuthStore } from "~/stores/auth";

const authStore = useAuthStore();

const linkClass =
  "block w-full text-left px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-brand transition-colors";
const activeClass = "bg-brand/10 text-brand font-semibold";
</script>

<template>
  <nav class="w-48 shrink-0">
    <ul class="space-y-1">
      <li>
        <NuxtLink
          to="/statistics"
          :class="linkClass"
          :active-class="activeClass"
          exact
        >
          General
        </NuxtLink>
      </li>
      <li>
        <NuxtLink
          to="/statistics/top-scorers"
          :class="linkClass"
          :active-class="activeClass"
        >
          Goleadores
        </NuxtLink>
      </li>
      <template v-if="authStore.isAuthenticated">
        <li>
          <NuxtLink
            to="/statistics/years"
            :class="linkClass"
            :active-class="activeClass"
          >
            Por año
          </NuxtLink>
        </li>
        <li>
          <NuxtLink
            to="/statistics/tournaments"
            :class="linkClass"
            :active-class="activeClass"
          >
            Por torneo
          </NuxtLink>
        </li>
        <li>
          <NuxtLink
            to="/statistics/rivals"
            :class="linkClass"
            :active-class="activeClass"
          >
            Por rival
          </NuxtLink>
        </li>
        <li>
          <NuxtLink
            to="/statistics/players"
            :class="linkClass"
            :active-class="activeClass"
          >
            Por jugador
          </NuxtLink>
        </li>
      </template>
    </ul>
  </nav>
</template>
