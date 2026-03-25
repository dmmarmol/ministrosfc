import { navigateTo } from "nuxt/app";
import { useAuthStore } from "../stores/auth";
import { useRuntime } from "~/composables/useRuntime";

/**
 * Nuxt route middleware — protects authenticated and role-restricted routes.
 *
 * Applied globally via definePageMeta({ middleware: 'auth' }) on protected pages,
 * or applied globally by registering in nuxt.config router.middleware.
 *
 * Route conventions:
 *   /admin/**  → requires ADMIN or EDITOR role
 *   /player/** → requires any authenticated user
 *   /login     → redirects authenticated users to /admin/dashboard
 */
export default defineNuxtRouteMiddleware((to) => {
  // Skip all access checks during SSR — auth state lives in localStorage which
  // is unavailable server-side. The auth-init.client.ts plugin restores it before
  // this middleware re-runs client-side after hydration.
  if (useRuntime().isServer) return;

  const authStore = useAuthStore();

  // If navigating to /login while already authenticated, redirect away
  if (to.path === "/login" && authStore.isAuthenticated) {
    return navigateTo(
      authStore.isEditor ? "/admin/dashboard" : "/player/games",
    );
  }

  // Admin / Editor routes
  if (to.path.startsWith("/admin")) {
    if (!authStore.isAuthenticated) {
      return navigateTo(`/login?redirect=${encodeURIComponent(to.path)}`);
    }
    if (!authStore.isEditor) {
      return navigateTo("/");
    }
  }

  // Player routes (any authenticated user)
  if (to.path.startsWith("/player")) {
    if (!authStore.isAuthenticated) {
      return navigateTo(`/login?redirect=${encodeURIComponent(to.path)}`);
    }
  }
});
