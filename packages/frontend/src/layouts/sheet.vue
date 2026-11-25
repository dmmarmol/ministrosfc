<script setup lang="ts">
import { useAuthStore } from "~/stores/auth";
import AdminProfileMenu from "~/components/common/AdminProfileMenu.vue";


const { t } = useI18n();
const authStore = useAuthStore();

const links = computed(() => [
  { to: "/", label: t("common.inicio"), exact: true, wideOnly: true },
  { to: "/roster", label: t("common.plantilla") },
  { to: "/schedule", label: t("common.calendario") },
  { to: "/tournaments", label: t("common.torneos") },
  {
    to: authStore.isAuthenticated ? "/statistics" : "/statistics/top-scorers",
    label: t("common.estadisticas"),
  },
]);
</script>

<template>
  <div class="sheet-world min-h-screen flex flex-col">
    <a
      href="#contenido"
      class="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-[var(--sheet-paper)] focus:p-3"
      >{{ t("layoutsSheet.irAlContenido") }}</a
    >
    <header class="sheet-paper">
      <div
        class="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 pt-4"
      >
        <NuxtLink
          to="/"
          class="flex items-center gap-3 no-underline"
          :aria-label="t('layoutsSheet.ministrosFcInicio')"
        >
          <span
            class="grid size-9 place-items-center rounded-full bg-[var(--sheet-ink)] text-[var(--sheet-paper)] shadow-[inset_0_0_0_3px_var(--sheet-ink),inset_0_0_0_4px_var(--sheet-paper)]"
            aria-hidden="true"
          >
            <span class="sheet-display text-base">M</span>
          </span>
          <span class="sheet-display text-xl">{{ t("layoutsSheet.ministrosFc") }}</span>
        </NuxtLink>
        <div class="flex items-center gap-3 text-sm">
          <UiColorModeToggle class="sheet-toggle" />
          <ClientOnly>
            <template v-if="authStore.isAuthenticated">
              <AdminProfileMenu v-if="authStore.isEditor" sheet />
              <template v-else>
                <NuxtLink to="/profile/player" class="font-bold"
                  >{{ t("layoutsSheet.miPerfil") }}</NuxtLink
                >
                <button
                  type="button"
                  class="underline decoration-[var(--sheet-blue)] decoration-2 underline-offset-4"
                  @click="authStore.logout()"
                >
                  {{ t("layoutsSheet.salir") }}
                </button>
              </template>
            </template>
            <NuxtLink v-else to="/login" class="font-bold">{{ t("common.ingresar") }}</NuxtLink>
            <template #fallback>
              <NuxtLink to="/login" class="font-bold">{{ t("common.ingresar") }}</NuxtLink>
            </template>
          </ClientOnly>
        </div>
      </div>
      <nav
        class="mx-auto mt-3 flex max-w-3xl justify-between gap-0 overflow-x-auto px-3 pb-3 sm:justify-start sm:gap-1 sm:px-4"
        :aria-label="t('layoutsSheet.principal')"
      >
        <NuxtLink
          v-for="l in links"
          :key="l.to"
          :to="l.to"
          :exact="l.exact"
          class="sheet-label whitespace-nowrap px-1 py-3 text-xs tracking-[0.04em] no-underline hover:underline max-[380px]:px-0.5 max-[380px]:!text-[0.6875rem] max-[380px]:!tracking-[0.02em] sm:px-2 sm:tracking-[0.12em]"
          :class="l.wideOnly && 'hidden sm:block'"
          active-class="!text-[var(--sheet-ink)] underline"
          exact-active-class="!text-[var(--sheet-ink)] underline"
          >{{ l.label }}</NuxtLink
        >
      </nav>
    </header>

    <main id="contenido" class="flex-1">
      <slot />
    </main>

    <footer class="sheet-on-ink sheet-footer">
      <div
        class="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm"
      >
        <span class="sheet-display text-lg">{{ t("layoutsSheet.ministrosFcDesde2023") }}</span>
        <span class="sheet-footer-accent"
          >&copy; {{ new Date().getFullYear() }}</span
        >
      </div>
    </footer>
  </div>
</template>
