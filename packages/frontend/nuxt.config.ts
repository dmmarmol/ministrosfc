// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  srcDir: "src/",
  devtools: { enabled: true },

  modules: ["@nuxtjs/tailwindcss", "@pinia/nuxt", "@nuxt/image"],

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

  // Auto-import Pinia stores from stores/ directory
  imports: {
    dirs: ["stores"],
  },

  typescript: {
    strict: true,
    typeCheck: false, // Skip type-check during build for speed; run tsc separately
  },
});
