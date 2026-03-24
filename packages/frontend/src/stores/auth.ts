import { defineStore } from "pinia";

interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "EDITOR" | "PLAYER";
}

interface AuthState {
  user: UserInfo | null;
  accessToken: string | null;
  refreshToken: string | null;
}

export const useAuthStore = defineStore("auth", {
  state: (): AuthState => ({
    user: null,
    accessToken: null,
    refreshToken: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    isAdmin: (state) => state.user?.role === "ADMIN",
    isEditor: (state) =>
      state.user?.role === "ADMIN" || state.user?.role === "EDITOR",
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
      if (import.meta.client) {
        localStorage.setItem("refreshToken", data.data.refreshToken);
        localStorage.setItem("user", JSON.stringify(data.data.user));
      }
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
      if (import.meta.client) {
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
      }
    },

    async refresh() {
      const config = useRuntimeConfig();
      const storedToken =
        this.refreshToken ??
        (import.meta.client ? localStorage.getItem("refreshToken") : null);
      if (!storedToken) throw new Error("No refresh token available");
      const data = await $fetch<{
        data: { accessToken: string; refreshToken: string };
      }>(`${config.public.apiBaseUrl}/api/v1/auth/refresh`, {
        method: "POST",
        body: { refreshToken: storedToken },
      });
      this.accessToken = data.data.accessToken;
      this.refreshToken = data.data.refreshToken;
      if (import.meta.client) {
        localStorage.setItem("refreshToken", data.data.refreshToken);
      }
    },

    loadFromStorage() {
      if (!import.meta.client) return;
      const storedUser = localStorage.getItem("user");
      const storedToken = localStorage.getItem("refreshToken");
      if (storedUser && storedToken) {
        this.user = JSON.parse(storedUser) as UserInfo;
        this.refreshToken = storedToken;
      }
    },
  },
});
