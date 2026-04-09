// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  srcDir: "src/",
  devtools: { enabled: true },

  modules: ["@nuxtjs/tailwindcss", "@pinia/nuxt", "@nuxt/image"],

  css: ["leaflet/dist/leaflet.css", "vue-select/dist/vue-select.css"],

  runtimeConfig: {
    public: {
      apiBaseUrl:
        process.env.NUXT_PUBLIC_API_BASE_URL ?? "http://localhost:5102",
      brandColor: process.env.NUXT_PUBLIC_BRAND_COLOR ?? "#D4AF37",
    },
  },

  tailwindcss: {
    configPath: "~/tailwind.config.js",
  },

  // Server-side rendering enabled for public SEO
  ssr: true,

  nitro: {
    port: parseInt(process.env.NUXT_PORT ?? "5103", 10),
  },

  // Bind the Vite dev server to the configured host.
  // Default is localhost; set NUXT_HOST=0.0.0.0 in .env.local to also accept
  // requests via custom hostnames such as localhost.ministrosfc.com.
  devServer: {
    host: process.env.NUXT_HOST ?? "localhost",
    port: parseInt(process.env.NUXT_PORT ?? "5103", 10),
  },

  // Vite 6+ blocks requests from non-localhost hostnames by default.
  // Whitelist the custom dev hostname so the browser can connect.
  // Resolve workspace CJS package to its TS source so Vite serves ESM natively.
  vite: {
    resolve: {
      alias: {
        "@ministrosfc/shared": new URL(
          "../shared/src/index.ts",
          import.meta.url,
        ).pathname,
      },
    },
    server: {
      allowedHosts: ["localhost.ministrosfc.com"],
    },
  },

  // Auto-import Pinia stores from stores/ directory
  imports: {
    dirs: ["stores"],
  },

  // Transpile workspace CJS packages so Vite serves them as ESM to the browser.
  build: {
    transpile: ["@ministrosfc/shared"],
  },

  typescript: {
    strict: true,
    typeCheck: false, // Skip type-check during build for speed; run tsc separately
  },
});
