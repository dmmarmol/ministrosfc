import { defineStore } from "pinia";
import { useRuntime } from "~/composables/useRuntime";
import { type UserRole } from "@ministrosfc/shared";

interface UserInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  playerId?: string | null;
  onboardingCompletedAt?: string | null;
}

interface AuthState {
  user: UserInfo | null;
  accessToken: string | null;
  refreshToken: string | null;
  hydrated: boolean;
}

export const useAuthStore = defineStore("auth", {
  state: (): AuthState => ({
    user: null,
    accessToken: null,
    refreshToken: null,
    hydrated: false,
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    isAdmin: (state) => state.user?.role === "ADMIN",
    isEditor: (state) =>
      state.user?.role === "ADMIN" || state.user?.role === "EDITOR",
    isDT: (state) =>
      state.user?.role === "ADMIN" ||
      state.user?.role === "EDITOR" ||
      state.user?.role === "DT",
    fullName: (state) =>
      state.user ? `${state.user.firstName} ${state.user.lastName}` : "",
    needsOnboarding: (state) =>
      state.user != null && !state.user.onboardingCompletedAt,
  },

  actions: {
    async login(email: string, password: string) {
      const config = useRuntimeConfig();
      const data = await $fetch<{
        data: { accessToken: string; refreshToken: string; user: UserInfo };
      }>(`${config.public.apiBaseUrl}/api/v1/auth/login`, {
        method: "POST",
        body: { email, password },
      });
      this.accessToken = data.data.accessToken;
      this.refreshToken = data.data.refreshToken;
      this.user = data.data.user;
      if (useRuntime().isClient) {
        sessionStorage.setItem("accessToken", data.data.accessToken);
        sessionStorage.setItem("refreshToken", data.data.refreshToken);
        sessionStorage.setItem("user", JSON.stringify(data.data.user));
      }
      this.hydrated = true;
    },

    async register(dto: {
      email: string;
      password: string;
      passwordConfirmation: string;
      firstName: string;
      lastName: string;
      isPlayer: boolean;
    }) {
      const config = useRuntimeConfig();
      const data = await $fetch<{
        data: { accessToken: string; refreshToken: string; user: UserInfo };
      }>(`${config.public.apiBaseUrl}/api/v1/auth/register`, {
        method: "POST",
        body: dto,
      });
      this.accessToken = data.data.accessToken;
      this.refreshToken = data.data.refreshToken;
      this.user = data.data.user;
      if (useRuntime().isClient) {
        sessionStorage.setItem("accessToken", data.data.accessToken);
        sessionStorage.setItem("refreshToken", data.data.refreshToken);
        sessionStorage.setItem("user", JSON.stringify(data.data.user));
      }
      this.hydrated = true;
    },

    async logout() {
      const config = useRuntimeConfig();
      if (this.refreshToken && this.accessToken) {
        try {
          await $fetch(`${config.public.apiBaseUrl}/api/v1/auth/logout`, {
            method: "POST",
            headers: { Authorization: `Bearer ${this.accessToken}` },
            body: { refreshToken: this.refreshToken },
          });
        } catch {
          // Silent fail on logout API error
        }
      }
      this.user = null;
      this.accessToken = null;
      this.refreshToken = null;
      if (useRuntime().isClient) {
        sessionStorage.removeItem("accessToken");
        sessionStorage.removeItem("refreshToken");
        sessionStorage.removeItem("user");
      }
      this.hydrated = true;
    },

    async refresh() {
      const config = useRuntimeConfig();
      const storedToken =
        this.refreshToken ??
        (useRuntime().isClient ? sessionStorage.getItem("refreshToken") : null);
      if (!storedToken) throw new Error("No refresh token available");
      const data = await $fetch<{
        data: { accessToken: string; refreshToken: string };
      }>(`${config.public.apiBaseUrl}/api/v1/auth/refresh`, {
        method: "POST",
        body: { refreshToken: storedToken },
      });
      this.accessToken = data.data.accessToken;
      this.refreshToken = data.data.refreshToken;
      if (useRuntime().isClient) {
        sessionStorage.setItem("accessToken", data.data.accessToken);
        sessionStorage.setItem("refreshToken", data.data.refreshToken);
      }
      this.hydrated = true;
    },

    loadFromStorage() {
      if (!useRuntime().isClient) return;
      if (this.hydrated) return;

      const storedUser = sessionStorage.getItem("user");
      const storedRefresh = sessionStorage.getItem("refreshToken");
      const storedAccess = sessionStorage.getItem("accessToken");

      if (storedUser && storedRefresh) {
        try {
          this.user = JSON.parse(storedUser) as UserInfo;
          this.refreshToken = storedRefresh;
          this.accessToken = storedAccess;
        } catch {
          this.user = null;
          this.accessToken = null;
          this.refreshToken = null;
          sessionStorage.removeItem("user");
          sessionStorage.removeItem("accessToken");
          sessionStorage.removeItem("refreshToken");
        }
      }

      this.hydrated = true;
    },

    setTokens(accessToken: string, refreshToken: string, user: UserInfo) {
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
      this.user = user;
      if (useRuntime().isClient) {
        sessionStorage.setItem("accessToken", accessToken);
        sessionStorage.setItem("refreshToken", refreshToken);
        sessionStorage.setItem("user", JSON.stringify(user));
      }
      this.hydrated = true;
    },
  },
});
