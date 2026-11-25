import { defineNuxtConfig } from "nuxt/config";
import { routeRules } from "./route-rules";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  future: { compatibilityVersion: 4 },
  srcDir: "src/",
  devtools: { enabled: true },

  modules: [
    "@pinia/nuxt",
    "@nuxt/image",
    "@nuxt/ui",
    "@nuxtjs/i18n",
    /** "@nuxtjs/color-mode", */
  ],

  // Spanish only for now; every visible string still goes through t() so a
  // second locale is a message file away. Messages: i18n/locales/es.json.
  i18n: {
    defaultLocale: "es",
    strategy: "no_prefix",
    detectBrowserLanguage: false,
    locales: [
      { code: "es", language: "es-AR", name: "Español", file: "es.json" },
    ],
  },

  css: [
    // "leaflet/dist/leaflet.css",
    // "vue-select/dist/vue-select.css",
    "~/assets/base.css",
  ],

  runtimeConfig: {
    public: {
      // Signup call to action on the public home stays hidden until adopted.
      signupCtaEnabled: process.env.NUXT_PUBLIC_SIGNUP_CTA_ENABLED === "true",
      apiBaseUrl:
        process.env.NUXT_PUBLIC_API_BASE_URL ?? "http://localhost:5102",
    },
  },

  // Server-side rendering enabled for public SEO
  ssr: true,

  // Cache public pages briefly (see route-rules.ts); private routes are never cached.
  // Production builds only: in development Nitro keeps this cache on disk under path-like keys,
  // where the cached root page (a file) collides with sub-routes (directories) and every page
  // after the first fails with ENOTDIR. Production keeps the cache in memory.
  routeRules: process.env.NODE_ENV === "production" ? routeRules : {},

  // Bind the Vite dev server to the configured host.
  // Default is localhost; set NUXT_HOST=0.0.0.0 in .env.local to also accept
  // requests via custom hostnames such as localhost.ministrosfc.com.
  devServer: {
    host: process.env.NUXT_HOST ?? "localhost",
    port: parseInt(process.env.NUXT_PORT ?? "5103", 10),
    https:
      process.env.NUXT_HTTPS === "true"
        ? {
            key: "./.certs/localhost.ministrosfc.com+2-key.pem",
            cert: "./.certs/localhost.ministrosfc.com+2.pem",
          }
        : false,
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

  experimental: {
    appManifest: false,
  },

});
