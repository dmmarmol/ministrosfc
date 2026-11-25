<script setup lang="ts">
import { useAuthStore } from "~/stores/auth";

const authStore = useAuthStore();

const links = computed(() => [
  { to: "/statistics", label: "General", exact: true },
  { to: "/statistics/top-scorers?playerStatus=ACTIVE", label: "Goleadores", match: "/statistics/top-scorers" },
  ...(authStore.isAuthenticated
    ? [
        { to: "/statistics/players", label: "Jugadores", match: "/statistics/players" },
        { to: "/statistics/rivals", label: "Rivales", match: "/statistics/rivals" },
        { to: "/statistics/years", label: "Por año", match: "/statistics/years" },
        { to: "/statistics/tournaments", label: "Por torneo", match: "/statistics/tournaments" },
      ]
    : []),
]);
const route = useRoute();
const isActive = (l: { exact?: boolean; match?: string; to: string }) =>
  l.exact ? route.path === l.to : route.path.startsWith(l.match ?? l.to);
</script>

<template>
  <nav aria-label="Estadísticas" class="border-b-[3px] border-[var(--sheet-ink)] bg-[var(--sheet-paper)]">
    <ul class="mx-auto flex max-w-5xl flex-wrap px-4">
      <li v-for="l in links" :key="l.label" class="shrink-0">
        <NuxtLink
          :to="l.to"
          class="block border-b-4 px-2.5 py-3 text-xs font-bold uppercase tracking-[0.06em] no-underline"
          :class="
            isActive(l)
              ? 'border-[var(--sheet-blue)] text-[var(--sheet-ink)]'
              : 'border-transparent text-[var(--sheet-blue)] hover:underline'
          "
          :aria-current="isActive(l) ? 'page' : undefined"
          >{{ l.label }}</NuxtLink
        >
      </li>
    </ul>
  </nav>
</template>
