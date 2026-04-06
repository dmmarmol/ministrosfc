import { ref } from "vue";
import { useAuthStore } from "~/stores/auth";
import { useRuntimeConfig } from "nuxt/app";

export function useJerseyAvailability() {
  const config = useRuntimeConfig();
  const authStore = useAuthStore();

  const taken = ref<number[]>([]);
  const loading = ref(false);

  async function fetch(excludePlayerId?: string) {
    loading.value = true;
    try {
      const params = excludePlayerId ? `?exclude=${excludePlayerId}` : "";
      const res = await $fetch<{ data: { taken: number[] } }>(
        `${config.public.apiBaseUrl}/api/v1/profile/player/jersey-availability${params}`,
        { headers: { Authorization: `Bearer ${authStore.accessToken}` } },
      );
      taken.value = res.data.taken;
    } catch {
      taken.value = [];
    } finally {
      loading.value = false;
    }
  }

  return { taken, loading, fetch };
}
