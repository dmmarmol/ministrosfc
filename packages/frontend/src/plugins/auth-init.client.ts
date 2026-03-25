import { useAuthStore } from "../stores/auth";

/**
 * Client-side plugin: restore auth state from localStorage on every page load/refresh.
 *
 * Nuxt plugins run before route middleware, so by the time the `auth` middleware
 * checks `authStore.isAuthenticated`, the user and refreshToken are already
 * hydrated from storage. Without this, a hard refresh resets Pinia to its empty
 * initial state and the middleware always redirects to /login.
 *
 * The `.client.ts` suffix ensures this only runs in the browser (localStorage is
 * not available during SSR). `loadFromStorage()` restores `user` and
 * `refreshToken`; a fresh `accessToken` is obtained lazily by the $api plugin
 * via its 401 → token-refresh flow on the first authenticated request.
 */
export default defineNuxtPlugin(() => {
  const authStore = useAuthStore();
  authStore.loadFromStorage();
});
