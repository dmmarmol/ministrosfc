/**
 * Unit test: auth Pinia store
 * Mocks Nuxt globals ($fetch, useRuntimeConfig) to test store actions in isolation
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import type { Mock } from "vitest";

// Stub Nuxt globals before importing the store
vi.stubGlobal("useRuntimeConfig", () => ({
  public: { apiBaseUrl: "http://localhost:5102" },
}));

const mockFetch = vi.fn();
vi.stubGlobal("$fetch", mockFetch);

vi.mock("../../src/composables/useRuntime", () => ({
  useRuntime: () => ({ isClient: true, isServer: false }),
}));

// Must import AFTER stubbing globals
const { useAuthStore } = await import("../../src/stores/auth");

const mockUser = {
  id: "u1",
  firstName: "Admin",
  lastName: "User",
  email: "admin@test.com",
  role: "ADMIN" as const,
};
const mockLoginResponse = {
  data: {
    accessToken: "access-token",
    refreshToken: "refresh-token",
    user: mockUser,
  },
};

describe("useAuthStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockFetch.mockReset();
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("initial state", () => {
    it("starts unauthenticated", () => {
      const store = useAuthStore();
      expect(store.user).toBeNull();
      expect(store.accessToken).toBeNull();
      expect(store.refreshToken).toBeNull();
    });

    it("isAuthenticated is false when user is null", () => {
      const store = useAuthStore();
      expect(store.isAuthenticated).toBe(false);
    });
  });

  describe("login", () => {
    it("sets user, accessToken, and refreshToken on success", async () => {
      mockFetch.mockResolvedValueOnce(mockLoginResponse);
      const store = useAuthStore();
      await store.login("admin@test.com", "password123");
      expect(store.user).toEqual(mockUser);
      expect(store.accessToken).toBe("access-token");
      expect(store.refreshToken).toBe("refresh-token");
    });

    it("calls the correct endpoint with POST", async () => {
      mockFetch.mockResolvedValueOnce(mockLoginResponse);
      const store = useAuthStore();
      await store.login("admin@test.com", "password123");
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:5102/api/v1/auth/login",
        expect.objectContaining({
          method: "POST",
          body: { email: "admin@test.com", password: "password123" },
        }),
      );
    });

    it("persists refreshToken and user to sessionStorage", async () => {
      mockFetch.mockResolvedValueOnce(mockLoginResponse);
      const store = useAuthStore();
      await store.login("admin@test.com", "password123");
      expect(sessionStorage.getItem("refreshToken")).toBe("refresh-token");
      expect(JSON.parse(sessionStorage.getItem("user")!)).toEqual(mockUser);
    });
  });

  describe("getters post-login", () => {
    it("isAuthenticated is true after login", async () => {
      mockFetch.mockResolvedValueOnce(mockLoginResponse);
      const store = useAuthStore();
      await store.login("admin@test.com", "password123");
      expect(store.isAuthenticated).toBe(true);
    });

    it("isAdmin is true for ADMIN role", async () => {
      mockFetch.mockResolvedValueOnce(mockLoginResponse);
      const store = useAuthStore();
      await store.login("admin@test.com", "password123");
      expect(store.isAdmin).toBe(true);
    });

    it("isEditor is true for ADMIN role", async () => {
      mockFetch.mockResolvedValueOnce(mockLoginResponse);
      const store = useAuthStore();
      await store.login("admin@test.com", "password123");
      expect(store.isEditor).toBe(true);
    });

    it("isAdmin is false for EDITOR role", async () => {
      const editorResponse = {
        data: {
          ...mockLoginResponse.data,
          user: { ...mockUser, role: "EDITOR" as const },
        },
      };
      mockFetch.mockResolvedValueOnce(editorResponse);
      const store = useAuthStore();
      await store.login("editor@test.com", "password123");
      expect(store.isAdmin).toBe(false);
      expect(store.isEditor).toBe(true);
    });

    it("isEditor is false for PLAYER role", async () => {
      const playerResponse = {
        data: {
          ...mockLoginResponse.data,
          user: { ...mockUser, role: "PLAYER" as const },
        },
      };
      mockFetch.mockResolvedValueOnce(playerResponse);
      const store = useAuthStore();
      await store.login("player@test.com", "password123");
      expect(store.isAdmin).toBe(false);
      expect(store.isEditor).toBe(false);
    });
  });

  describe("logout", () => {
    it("clears user, accessToken, and refreshToken", async () => {
      mockFetch
        .mockResolvedValueOnce(mockLoginResponse)
        .mockResolvedValueOnce({});
      const store = useAuthStore();
      await store.login("admin@test.com", "password123");
      await store.logout();
      expect(store.user).toBeNull();
      expect(store.accessToken).toBeNull();
      expect(store.refreshToken).toBeNull();
    });

    it("clears sessionStorage on logout", async () => {
      mockFetch
        .mockResolvedValueOnce(mockLoginResponse)
        .mockResolvedValueOnce({});
      const store = useAuthStore();
      await store.login("admin@test.com", "password123");
      await store.logout();
      expect(sessionStorage.getItem("refreshToken")).toBeNull();
      expect(sessionStorage.getItem("user")).toBeNull();
    });

    it("proceeds silently if logout API call fails", async () => {
      mockFetch
        .mockResolvedValueOnce(mockLoginResponse)
        .mockRejectedValueOnce(new Error("Network error"));
      const store = useAuthStore();
      await store.login("admin@test.com", "password123");
      await expect(store.logout()).resolves.not.toThrow();
      expect(store.user).toBeNull();
    });
  });

  describe("loadFromStorage", () => {
    it("restores user and refreshToken from sessionStorage", () => {
      sessionStorage.setItem("user", JSON.stringify(mockUser));
      sessionStorage.setItem("refreshToken", "stored-refresh-token");
      const store = useAuthStore();
      store.loadFromStorage();
      expect(store.user).toEqual(mockUser);
      expect(store.refreshToken).toBe("stored-refresh-token");
    });

    it("does not restore if sessionStorage is empty", () => {
      const store = useAuthStore();
      store.loadFromStorage();
      expect(store.user).toBeNull();
    });
  });

  describe("refresh", () => {
    it("updates accessToken and refreshToken", async () => {
      mockFetch.mockResolvedValueOnce(mockLoginResponse);
      const store = useAuthStore();
      await store.login("admin@test.com", "password123");

      mockFetch.mockResolvedValueOnce({
        data: {
          accessToken: "new-access-token",
          refreshToken: "new-refresh-token",
        },
      });
      await store.refresh();
      expect(store.accessToken).toBe("new-access-token");
      expect(store.refreshToken).toBe("new-refresh-token");
    });

    it("throws when no refresh token is available", async () => {
      const store = useAuthStore();
      await expect(store.refresh()).rejects.toThrow(
        "No refresh token available",
      );
    });
  });
});
