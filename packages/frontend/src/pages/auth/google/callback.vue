<script setup lang="ts">
import { onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "~/stores/auth";
import { useRuntime } from "~/composables/useRuntime";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

onMounted(() => {
  if (!useRuntime().isClient) return;

  const error = route.query.error as string | undefined;
  const token = route.query.token as string | undefined;
  const refresh = route.query.refresh as string | undefined;

  if (error) {
    navigateTo(`/login?error=${error}`);
    return;
  }

  if (!token || !refresh) {
    navigateTo("/login?error=google_failed");
    return;
  }

  try {
    // Decode JWT payload to extract user info (no verification needed — CMS signed it)
    const payloadBase64 = token.split(".")[1];
    const payloadJson = atob(payloadBase64);
    const payload = JSON.parse(payloadJson) as {
      userId: string;
      role: string;
    };

    // We have userId & role from the token, but need full user info.
    // Store tokens first, then fetch profile for user details.
    authStore.accessToken = token;
    authStore.refreshToken = refresh;

    // Fetch user info from the API
    const config = useRuntimeConfig();
    $fetch<{
      data: {
        user: {
          id: string;
          firstName: string;
          lastName: string;
          email: string;
          role: string;
        };
      };
    }>(`${config.public.apiBaseUrl}/api/v1/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        const u = res.data.user;
        authStore.setTokens(token, refresh, {
          id: u.id,
          firstName: u.firstName,
          lastName: u.lastName,
          email: u.email,
          role: u.role as any,
        });
        navigateTo("/");
      })
      .catch(() => {
        // If profile doesn't exist yet, use JWT payload
        authStore.setTokens(token, refresh, {
          id: payload.userId,
          firstName: "",
          lastName: "",
          email: "",
          role: payload.role as any,
        });
        navigateTo("/");
      });
  } catch {
    navigateTo("/login?error=google_failed");
  }
});
</script>

<template>
  <div class="min-h-screen flex items-center justify-center">
    <p class="text-gray-500 text-sm">Procesando autenticación…</p>
  </div>
</template>
