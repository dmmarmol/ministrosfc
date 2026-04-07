import { ref } from "vue";
import { useRuntimeConfig } from "nuxt/app";
import { useAuthStore } from "~/stores/auth";
import type {
  Playground,
  PlaygroundCreatePayload,
  PlaygroundUpdatePayload,
} from "@ministrosfc/shared";

export function usePlaygrounds() {
  const config = useRuntimeConfig();
  const authStore = useAuthStore();

  const playgrounds = ref<Playground[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const baseUrl = `${config.public.apiBaseUrl}/api/v1/playgrounds`;

  function authHeaders() {
    return { Authorization: `Bearer ${authStore.accessToken}` };
  }

  async function fetchPlaygrounds(): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      const res = await $fetch<{ data: Playground[] }>(baseUrl);
      playgrounds.value = res.data;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Error al cargar canchas";
    } finally {
      loading.value = false;
    }
  }

  async function createPlayground(
    payload: PlaygroundCreatePayload,
  ): Promise<Playground> {
    const res = await $fetch<{ data: Playground }>(baseUrl, {
      method: "POST",
      headers: authHeaders(),
      body: payload,
    });
    await fetchPlaygrounds();
    return res.data;
  }

  async function updatePlayground(
    id: string,
    payload: PlaygroundUpdatePayload,
  ): Promise<void> {
    await $fetch(`${baseUrl}/${id}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: payload,
    });
    await fetchPlaygrounds();
  }

  async function deletePlayground(id: string): Promise<void> {
    await $fetch(`${baseUrl}/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    await fetchPlaygrounds();
  }

  return {
    playgrounds,
    loading,
    error,
    fetchPlaygrounds,
    createPlayground,
    updatePlayground,
    deletePlayground,
  };
}
