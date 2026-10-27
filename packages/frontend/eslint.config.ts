import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginVue from "eslint-plugin-vue";
import { defineConfig } from "eslint/config";

const nuxtGlobals = {
  useRouter: "readonly",
  useRoute: "readonly",
  useRuntimeConfig: "readonly",
  useNuxtApp: "readonly",
  defineNuxtPlugin: "readonly",
  defineNuxtRouteMiddleware: "readonly",
  definePageMeta: "readonly",
  navigateTo: "readonly",
  useFetch: "readonly",
  useAsyncData: "readonly",
  useHead: "readonly",
  useSeoMeta: "readonly",
  useState: "readonly",
  useCookie: "readonly",
  useRequestEvent: "readonly",
  useRequestFetch: "readonly",
  useLazyFetch: "readonly",
  $fetch: "readonly",
  ref: "readonly",
  computed: "readonly",
  watch: "readonly",
  watchEffect: "readonly",
  onMounted: "readonly",
  onUnmounted: "readonly",
  onBeforeMount: "readonly",
  onBeforeUnmount: "readonly",
  nextTick: "readonly",
  inject: "readonly",
  provide: "readonly",
  createError: "readonly",
  showError: "readonly",
  clearNuxtState: "readonly",
  reloadNuxtApp: "readonly",
  abortNavigation: "readonly",
  useRouteAnnouncer: "readonly",
};

export default defineConfig([
  {
    ignores: ["**/.nuxt/**", "**/.output/**", "**/dist/**", "**/node_modules/**"],
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,vue}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...nuxtGlobals,
      },
    },
  },
  tseslint.configs.recommended,
  pluginVue.configs["flat/essential"],
  {
    files: ["**/*.vue"],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },
]);
