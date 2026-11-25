import { ref } from "vue";
import { useAuthStore } from "~/stores/auth";
import { useRuntimeConfig } from "nuxt/app";

export function useOnboarding() {
  const { t } = useI18n();
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
    } catch (e: unknown) {
      error.value =
        (e as Error)?.message ?? t("errors.errorAlCargarElEstado");
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
    } catch (e: unknown) {
      if ((e as any)?.data?.code === "DUPLICATE_JERSEY_NUMBER") {
        error.value = t("errors.eseNumeroDeCamisetaYa");
      } else {
        error.value =
          (e as Error)?.message ?? t("errors.errorAlCompletarElOnboarding");
      }
      throw e;
    } finally {
      loading.value = false;
    }
  }

  return { loading, error, fetchStatus, completeOnboarding };
}
