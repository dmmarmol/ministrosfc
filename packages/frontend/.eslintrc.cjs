module.exports = {
  root: true,
  env: {
    browser: true,
    es2020: true,
    node: true,
  },
  globals: {
    // Nuxt auto-imports
    useRouter: "readonly",
    useRoute: "readonly",
    useRuntimeConfig: "readonly",
    useNuxtApp: "readonly",
    defineNuxtPlugin: "readonly",
    defineNuxtRouteMiddleware: "readonly",
    navigateTo: "readonly",
    useFetch: "readonly",
    useAsyncData: "readonly",
    $fetch: "readonly",
    ref: "readonly",
    computed: "readonly",
    watch: "readonly",
    onMounted: "readonly",
    onUnmounted: "readonly",
  },
  extends: ["eslint:recommended"],
  rules: {
    "no-unused-vars": [
      "warn",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
    ],
  },
  overrides: [
    {
      files: ["**/*.ts"],
      parser: "@typescript-eslint/parser",
      plugins: ["@typescript-eslint"],
      rules: {
        "@typescript-eslint/no-unused-vars": [
          "warn",
          { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
        ],
        "@typescript-eslint/no-explicit-any": "warn",
        "no-unused-vars": "off",
      },
    },
    {
      files: ["tests/**/*.ts", "**/*.test.ts", "**/*.spec.ts"],
      globals: {
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        vi: "readonly",
      },
    },
  ],
};
