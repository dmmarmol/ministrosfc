import { ref } from "vue";
import { useAuthStore } from "~/stores/auth";

export function useOnboarding() {
  const config = useRuntimeConfig();
  const authStore = useAuthStore();
  const loading = ref(false);
  const error = ref("");

  async function fetchStatus() {
    loading.value = true;
    error.value = "";
    try {
      const res = await $fetch<{
        data: {
          needsOnboarding: boolean;
          prefill: {
            isPlayer: boolean;
            jerseyNumber: number | null;
            position: string | null;
          };
        };
      }>(`${config.public.apiBaseUrl}/api/v1/onboarding/status`, {
        headers: { Authorization: `Bearer ${authStore.accessToken}` },
      });
      return res.data;
    } catch (e: any) {
      error.value = e?.message ?? "Error al cargar el estado de onboarding.";
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function completeOnboarding(dto: {
    isPlayer: boolean;
    jerseyNumber?: number | null;
    position?: string | null;
  }) {
    loading.value = true;
    error.value = "";
    try {
      const res = await $fetch<{
        data: {
          user: {
            id: string;
            email: string;
            firstName?: string;
            lastName?: string;
            role: string;
            playerId: string | null;
            onboardingCompletedAt: string | null;
          };
          nextStep: string;
        };
      }>(`${config.public.apiBaseUrl}/api/v1/onboarding/complete`, {
        method: "POST",
        headers: { Authorization: `Bearer ${authStore.accessToken}` },
        body: dto,
      });
      return res.data;
    } catch (e: any) {
      if (e?.data?.code === "DUPLICATE_JERSEY_NUMBER") {
        error.value = "Ese número de camiseta ya está en uso.";
      } else {
        error.value = e?.message ?? "Error al completar el onboarding.";
      }
      throw e;
    } finally {
      loading.value = false;
    }
  }

  return { loading, error, fetchStatus, completeOnboarding };
}
