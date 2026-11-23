<script setup lang="ts">
/**
 * Icon-only light/dark switch. Relies on Nuxt UI's color mode (persisted in
 * localStorage, toggles `.dark` on <html>). Rendered client-side only because
 * the resolved mode is unknown during SSR.
 */
withDefaults(defineProps<{ variant?: "ghost" | "soft" }>(), {
  variant: "ghost",
});

const colorMode = useColorMode();

const isDark = computed(() => colorMode.value === "dark");
const label = computed(() =>
  isDark.value ? "Cambiar a modo claro" : "Cambiar a modo oscuro",
);

function toggle() {
  colorMode.preference = isDark.value ? "light" : "dark";
}
</script>

<template>
  <ClientOnly>
    <UButton
      type="button"
      color="neutral"
      :variant="variant"
      size="sm"
      square
      class="shrink-0"
      :icon="isDark ? 'mdi:weather-sunny' : 'mdi:weather-night'"
      :aria-label="label"
      :title="label"
      @click="toggle"
    />
    <template #fallback>
      <span class="inline-block size-8 shrink-0" aria-hidden="true" />
    </template>
  </ClientOnly>
</template>
