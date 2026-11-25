<script setup lang="ts">
import HomeArrow from "./HomeArrow.vue";


const { t } = useI18n();</script>

<template>
  <nav :aria-label="t('homeHomeCopies.masSecciones')" class="sheet-on-ink">
    <NuxtLink
      to="/roster"
      class="sheet-display flex items-center justify-between bg-[var(--sheet-ink)] py-4 text-3xl text-[var(--sheet-paper)] no-underline hover:bg-[var(--sheet-ink-soft)]"
    >
      <span class="mx-auto flex w-full max-w-3xl items-center justify-between px-4">
        {{ t("common.plantilla") }}
        <HomeArrow class="text-[var(--sheet-blue-on-ink)]" />
      </span>
    </NuxtLink>
    <NuxtLink
      to="/statistics/top-scorers"
      class="sheet-display flex items-center justify-between border-b-[3px] border-[var(--sheet-ink)] bg-[var(--sheet-paper)] py-4 text-3xl no-underline hover:bg-[var(--sheet-ground)]"
    >
      <span class="mx-auto flex w-full max-w-3xl items-center justify-between px-4">
        {{ t("homeHomeCopies.estadisticas") }}
        <HomeArrow class="text-[var(--sheet-blue)]" />
      </span>
    </NuxtLink>
  </nav>
</template>
