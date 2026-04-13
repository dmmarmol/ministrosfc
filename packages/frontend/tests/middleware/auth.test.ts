/**
 * Unit tests: auth Nuxt route middleware
 *
 * Verifies that:
 *  - The middleware returns early (no redirect) when running server-side (FR-001, SC-001)
 *  - Unauthenticated users are redirected to /login with the redirect param (FR-004)
 *  - Authenticated users pass through to protected routes (FR-002)
 *  - Role-based access checks are not broken (FR-005)
 *  - Authenticated users visiting /login are redirected away (FR-002)
 *
 * Mocking strategy:
 *  - `nuxt/app` is vi.mock'd to prevent Nuxt from requiring build artifacts in Vitest
 *  - `useRuntime` is mocked via vi.mock to simulate server vs. client contexts
 *  - `useAuthStore` is mocked to control auth state without a real Pinia instance
 *  - `defineNuxtRouteMiddleware` is stubbed as a Nuxt global (auto-import, not explicit)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { RouteLocationNormalized } from "vue-router";

// ── Mock nuxt/app before anything that imports from it ─────────────────────
// navigateTo is explicitly imported from "nuxt/app" in the middleware; mocking
// the whole module prevents Nuxt from resolving its build-time #build/* imports.
const mockNavigateTo = vi.fn((path: string) => path);
vi.mock("nuxt/app", () => ({
  navigateTo: (path: string) => mockNavigateTo(path),
}));

// ── defineNuxtRouteMiddleware is a Nuxt auto-import (no explicit import in middleware) ──
// Unwrap the handler so we can call it directly in tests.
vi.stubGlobal(
  "defineNuxtRouteMiddleware",
  (handler: (to: RouteLocationNormalized) => unknown) => handler,
);

// ── useRuntime mock ────────────────────────────────────────────────────────────
const mockUseRuntime = vi.fn(() => ({ isServer: false, isClient: true }));
vi.mock("~/composables/useRuntime", () => ({
  useRuntime: () => mockUseRuntime(),
}));

// ── useAuthStore mock ──────────────────────────────────────────────────────────
const mockAuthStore: {
  isAuthenticated: boolean;
  isEditor: boolean;
  isAdmin: boolean;
  needsOnboarding: boolean;
  loadFromStorage: ReturnType<typeof vi.fn>;
} = {
  isAuthenticated: false,
  isEditor: false,
  isAdmin: false,
  needsOnboarding: false,
  loadFromStorage: vi.fn(),
};
vi.mock("../../src/stores/auth", () => ({
  useAuthStore: () => mockAuthStore,
}));

// Import middleware AFTER all stubs so the module picks up the mocked dependencies
const { default: authMiddleware } =
  await import("../../src/middleware/auth.ts");

// ── Helper: build a minimal route object ──────────────────────────────────────
function route(path: string): RouteLocationNormalized {
  const meta: Record<string, unknown> = {};
  if (path.startsWith("/admin")) {
    meta.requiresAuth = true;
    meta.requiresRole = "editor";
  }
  if (path.startsWith("/player")) {
    meta.requiresAuth = true;
  }
  if (path === "/login" || path === "/register") {
    meta.authPage = true;
  }

  return {
    path,
    fullPath: path,
    query: {},
    params: {},
    hash: "",
    matched: [],
    meta,
    name: undefined,
    redirectedFrom: undefined,
  } as unknown as RouteLocationNormalized;
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe("auth middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: client context, unauthenticated
    mockUseRuntime.mockReturnValue({ isServer: false, isClient: true });
    mockAuthStore.isAuthenticated = false;
    mockAuthStore.isEditor = false;
    mockAuthStore.isAdmin = false;
    mockAuthStore.needsOnboarding = false;
  });

  // ── T003: SSR guard ──────────────────────────────────────────────────────────
  describe("SSR context (isServer: true)", () => {
    it("returns undefined immediately without calling navigateTo on any protected route", () => {
      mockUseRuntime.mockReturnValue({ isServer: true, isClient: false });

      const result = authMiddleware(route("/admin/dashboard"));

      expect(result).toBeUndefined();
      expect(mockNavigateTo).not.toHaveBeenCalled();
    });

    it("returns undefined even for /player routes on the server", () => {
      mockUseRuntime.mockReturnValue({ isServer: true, isClient: false });

      const result = authMiddleware(route("/player/games"));

      expect(result).toBeUndefined();
      expect(mockNavigateTo).not.toHaveBeenCalled();
    });

    it("returns undefined for /login route on the server", () => {
      mockUseRuntime.mockReturnValue({ isServer: true, isClient: false });
      mockAuthStore.isAuthenticated = true;
      mockAuthStore.isEditor = true;

      const result = authMiddleware(route("/login"));

      expect(result).toBeUndefined();
      expect(mockNavigateTo).not.toHaveBeenCalled();
    });
  });

  // ── T004: Unauthenticated → /admin redirect ──────────────────────────────────
  describe("unauthenticated client access to /admin routes", () => {
    it("redirects to /login with redirect param for /admin/dashboard", () => {
      authMiddleware(route("/admin/dashboard"));

      expect(mockNavigateTo).toHaveBeenCalledWith(
        "/login?redirect=%2Fadmin%2Fdashboard",
      );
    });

    it("redirects to /login with redirect param for /admin/games", () => {
      authMiddleware(route("/admin/games"));

      expect(mockNavigateTo).toHaveBeenCalledWith(
        "/login?redirect=%2Fadmin%2Fgames",
      );
    });
  });

  // ── T005: Unauthenticated → /player redirect ─────────────────────────────────
  describe("unauthenticated client access to /player routes", () => {
    it("redirects to /login with redirect param for /player/games", () => {
      authMiddleware(route("/player/games"));

      expect(mockNavigateTo).toHaveBeenCalledWith(
        "/login?redirect=%2Fplayer%2Fgames",
      );
    });
  });

  // ── T006: Authenticated ADMIN passes through /admin ─────────────────────────
  describe("authenticated ADMIN accessing /admin routes", () => {
    beforeEach(() => {
      mockAuthStore.isAuthenticated = true;
      mockAuthStore.isEditor = true;
      mockAuthStore.isAdmin = true;
    });

    it("does not redirect and returns undefined for /admin/dashboard", () => {
      const result = authMiddleware(route("/admin/dashboard"));

      expect(mockNavigateTo).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
    });

    it("does not redirect for /admin/players", () => {
      const result = authMiddleware(route("/admin/players"));

      expect(mockNavigateTo).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
    });
  });

  // ── T007: Authenticated PLAYER blocked from /admin ───────────────────────────
  describe("authenticated PLAYER accessing /admin routes", () => {
    beforeEach(() => {
      mockAuthStore.isAuthenticated = true;
      mockAuthStore.isEditor = false;
      mockAuthStore.isAdmin = false;
    });

    it("redirects to / for /admin/dashboard", () => {
      authMiddleware(route("/admin/dashboard"));

      expect(mockNavigateTo).toHaveBeenCalledWith("/");
    });
  });

  // ── T008: Authenticated ADMIN visiting /login ──────────────────────────────
  describe("authenticated ADMIN visiting /login", () => {
    beforeEach(() => {
      mockAuthStore.isAuthenticated = true;
      mockAuthStore.isEditor = true;
      mockAuthStore.isAdmin = true;
    });

    it("redirects ADMIN to /admin/dashboard", () => {
      authMiddleware(route("/login"));

      expect(mockNavigateTo).toHaveBeenCalledWith("/admin/dashboard");
    });
  });

  // ── T009: Authenticated PLAYER visiting /login ────────────────────────────
  describe("authenticated PLAYER visiting /login", () => {
    beforeEach(() => {
      mockAuthStore.isAuthenticated = true;
      mockAuthStore.isEditor = false;
      mockAuthStore.isAdmin = false;
    });

    it("redirects PLAYER to /", () => {
      authMiddleware(route("/login"));

      expect(mockNavigateTo).toHaveBeenCalledWith("/");
    });
  });

  // ── T015 (US2): encodeURIComponent validation ─────────────────────────────
  describe("US2: redirect query param encoding", () => {
    it("correctly percent-encodes the redirect path for /admin/games", () => {
      authMiddleware(route("/admin/games"));

      expect(mockNavigateTo).toHaveBeenCalledWith(
        "/login?redirect=%2Fadmin%2Fgames",
      );
    });

    it("correctly percent-encodes the redirect path for /player/games", () => {
      authMiddleware(route("/player/games"));

      expect(mockNavigateTo).toHaveBeenCalledWith(
        "/login?redirect=%2Fplayer%2Fgames",
      );
    });
  });

  // ── Authenticated PLAYER accessing /player routes ────────────────────────
  describe("authenticated PLAYER accessing /player routes", () => {
    beforeEach(() => {
      mockAuthStore.isAuthenticated = true;
      mockAuthStore.isEditor = false;
      mockAuthStore.isAdmin = false;
    });

    it("does not redirect for /player/games", () => {
      const result = authMiddleware(route("/player/games"));

      expect(mockNavigateTo).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
    });
  });
});
