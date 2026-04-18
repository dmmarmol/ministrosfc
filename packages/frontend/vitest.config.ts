import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";
import type { Plugin } from "vite";

/**
 * Nuxt shim plugin: replaces import.meta.client/server with boolean literals
 * so store code that guards with `if (import.meta.client)` works in Vitest.
 */
function nuxtMetaShimPlugin(): Plugin {
  return {
    name: "nuxt-meta-shim",
    transform(code) {
      if (
        !code.includes("import.meta.client") &&
        !code.includes("import.meta.server")
      )
        return;
      return code
        .replace(/import\.meta\.client/g, "true")
        .replace(/import\.meta\.server/g, "false");
    },
  };
}

export default defineConfig({
  plugins: [vue(), nuxtMetaShimPlugin()],
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    exclude: ["tests/e2e/**", "node_modules/**"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{vue,ts}"],
      exclude: ["src/plugins/**"],
      thresholds: {
        statements: 60,
        branches: 50,
        functions: 60,
        lines: 60,
      },
    },
  },
  resolve: {
    alias: {
      "~": resolve(__dirname, "src"),
      "@": resolve(__dirname, "src"),
      "#build/nuxt.config.mjs": resolve(
        __dirname,
        "tests/stubs/nuxt.config.mjs",
      ),
    },
  },
});
