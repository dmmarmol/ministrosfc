import { navigateTo } from "nuxt/app";
import { useAuthStore } from "../stores/auth";
import { useRuntime } from "~/composables/useRuntime";

/**
 * Nuxt route middleware — reads policy from per-page definePageMeta.
 *
 * Page meta options:
 *   requiresAuth: true          — any authenticated user
 *   requiresRole: "editor"      — ADMIN or EDITOR role
 *   requiresRole: "admin"       — ADMIN only
 *   authPage: true              — login/register pages (redirect away if already authed)
 *   onboardingPage: true        — onboarding page (skips the needsOnboarding redirect)
 *   skipOnboardingCheck: true   — skip the incomplete-onboarding redirect (e.g. /profile/player)
 */
export default defineNuxtRouteMiddleware((to) => {
  // Skip during SSR — auth state lives in sessionStorage, unavailable server-side.
  // auth-init.client.ts restores it before this re-runs on the client after hydration.
  if (useRuntime().isServer) return;

  const authStore = useAuthStore();
  authStore.loadFromStorage();

  const meta = to.meta as {
    requiresAuth?: boolean;
    /** @TODO is it possible to use UserRole enum for this? */
    requiresRole?: "editor" | "admin";
    authPage?: boolean;
    onboardingPage?: boolean;
    skipOnboardingCheck?: boolean;
  };

  // Auth pages (login/register) — redirect away if already authenticated
  if (meta.authPage) {
    if (authStore.isAuthenticated) {
      return navigateTo(authStore.isEditor ? "/admin/dashboard" : "/");
    }
    return;
  }

  // No auth requirement — allow through
  if (!meta.requiresAuth) return;

  // Unauthenticated — redirect to login with return path
  if (!authStore.isAuthenticated) {
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`);
  }

  // Authenticated: redirect to onboarding if profile is incomplete
  // (skip on the onboarding page itself and on pages that explicitly opt out)
  if (
    authStore.needsOnboarding &&
    !meta.onboardingPage &&
    !meta.skipOnboardingCheck
  ) {
    return navigateTo(
      `/auth/onboarding?redirect=${encodeURIComponent(to.fullPath)}`,
    );
  }

  // Role check
  if (meta.requiresRole === "admin" && !authStore.isAdmin) {
    return navigateTo("/");
  }
  if (meta.requiresRole === "editor" && !authStore.isEditor) {
    return navigateTo("/");
  }
});
