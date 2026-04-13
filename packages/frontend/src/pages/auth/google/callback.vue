<script setup lang="ts">
import { onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "~/stores/auth";
import { useRuntime } from "~/composables/useRuntime";
import { useOnboarding } from "~/composables/useOnboarding";

definePageMeta({ middleware: "auth", authPage: true });

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { fetchStatus } = useOnboarding();

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

    // Store tokens first, then fetch profile for user details
    authStore.accessToken = token;
    authStore.refreshToken = refresh;

    const config = useRuntimeConfig();
    $fetch<{
      data: {
        user: {
          id: string;
          firstName: string;
          lastName: string;
          email: string;
          role: string;
          playerId: string | null;
          onboardingCompletedAt: string | null;
        };
      };
    }>(`${config.public.apiBaseUrl}/api/v1/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        const u = res.data.user;
        authStore.setTokens(token, refresh, {
          id: u.id,
          firstName: u.firstName,
          lastName: u.lastName,
          email: u.email,
          role: u.role as any,
          playerId: u.playerId,
          onboardingCompletedAt: u.onboardingCompletedAt,
        });
        await navigateAfterAuth();
      })
      .catch(async () => {
        // If profile fetch fails, use JWT payload and check onboarding
        authStore.setTokens(token, refresh, {
          id: payload.userId,
          firstName: "",
          lastName: "",
          email: "",
          role: payload.role as any,
        });
        await navigateAfterAuth();
      });
  } catch {
    navigateTo("/login?error=google_failed");
  }
});

async function navigateAfterAuth() {
  try {
    const status = await fetchStatus();
    if (status.needsOnboarding) {
      navigateTo("/auth/onboarding");
      return;
    }
  } catch {
    // If onboarding check fails, use store getter
    if (authStore.needsOnboarding) {
      navigateTo("/auth/onboarding");
      return;
    }
  }

  navigateTo(authStore.isEditor ? "/admin/dashboard" : "/player/games");
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center">
    <p class="text-gray-500 text-sm">Procesando autenticación…</p>
  </div>
</template>
