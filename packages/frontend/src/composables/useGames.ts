import { ref } from "vue";
import { useRuntimeConfig } from "nuxt/app";
import { useAuthStore } from "~/stores/auth";
import type {
  Game,
  GameCreatePayload,
  GameUpdatePayload,
} from "@ministrosfc/shared";

export function useGames() {
  const config = useRuntimeConfig();
  const authStore = useAuthStore();

  const games = ref<Game[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const baseUrl = `${config.public.apiBaseUrl}/api/v1/games`;

  function authHeaders() {
    return { Authorization: `Bearer ${authStore.accessToken}` };
  }

  async function fetchGame(id: string): Promise<Game> {
    loading.value = true;
    error.value = null;
    try {
      const res = await $fetch<{ data: Game }>(`${baseUrl}/${id}`);
      return res.data;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Error al cargar partidos";
    } finally {
      loading.value = false;
    }
    throw new Error(error.value ?? "Error al cargar el partido.");
  }

  async function fetchGames(): Promise<Game[]> {
    loading.value = true;
    error.value = null;
    try {
      const res = await $fetch<{ data: Game[] }>(baseUrl);
      games.value = res.data;
      return res.data;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Error al cargar partidos";
      return [];
    } finally {
      loading.value = false;
    }
  }

  async function createGame(payload: GameCreatePayload): Promise<Game> {
    const res = await $fetch<{ data: Game }>(baseUrl, {
      method: "POST",
      headers: authHeaders(),
      body: payload,
    });
    await fetchGames();
    return res.data;
  }

  async function updateGame(
    id: string,
    payload: GameUpdatePayload,
  ): Promise<void> {
    await $fetch(`${baseUrl}/${id}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: payload,
    });
    await fetchGames();
  }

  async function deleteGame(id: string): Promise<void> {
    await $fetch(`${baseUrl}/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    await fetchGames();
  }

  return {
    games,
    loading,
    error,
    fetchGame,
    fetchGames,
    createGame,
    updateGame,
    deleteGame,
  };
}
