<script setup lang="ts">
import type { NuxtError } from "#app";


const { t } = useI18n();
const props = defineProps<{ error: NuxtError }>();

const notFound = computed(() => props.error.statusCode === 404);
const title = computed(() => (notFound.value ? t("error.noEncontrado") : t("error.algoSalioMal")));
const message = computed(() =>
  notFound.value
    ? t("error.laPaginaQueBuscas")
    : t("error.tuvimosUnProblemaAl"),
);

useHead(() => ({ title: title.value }));
const goHome = () => clearError({ redirect: "/" });
</script>

<template>
  <NuxtLayout name="sheet">
    <div class="mx-auto max-w-3xl px-4 pb-16 pt-10">
      <p class="sheet-display sheet-num text-[clamp(6rem,32vw,12rem)] text-[var(--sheet-blue)]">
        {{ error.statusCode }}
      </p>
      <h1 class="sheet-display text-[clamp(3rem,14vw,5rem)]">{{ title }}</h1>
      <p class="mt-3 max-w-prose">{{ message }}</p>
      <button type="button" class="sheet-button mt-6" @click="goHome">{{ t("error.volverAlInicio") }}</button>
    </div>
  </NuxtLayout>
</template>
