import { ref } from "vue";
import { useRuntimeConfig } from "nuxt/app";
import type {
  PaginatedResponse,
  Player,
  PlayerCreateDTO,
  PlayerListQuery,
  PlayerUpdateDTO,
} from "@ministrosfc/shared";
import { useAuthStore } from "~/stores/auth";

export function usePlayers() {
  const { t } = useI18n();
  const config = useRuntimeConfig();
  const authStore = useAuthStore();
  const players = ref<Player[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const baseUrl = `${config.public.apiBaseUrl}/api/v1/players`;

  function authHeaders(): Record<string, string> {
    return authStore.accessToken
      ? { Authorization: `Bearer ${authStore.accessToken}` }
      : {};
  }

  async function fetchPlayers(
    query: PlayerListQuery = {},
  ): Promise<PaginatedResponse<Player>> {
    loading.value = true;
    error.value = null;
    try {
      const response = await $fetch<PaginatedResponse<Player>>(baseUrl, {
        query,
        headers: authHeaders(),
      });
      players.value = response.data;
      return response;
    } catch (cause) {
      error.value =
        cause instanceof Error ? cause.message : t("errors.errorAlCargarJugadores");
      throw cause;
    } finally {
      loading.value = false;
    }
  }

  async function fetchPlayerById(id: string): Promise<Player> {
    const response = await $fetch<{ data: Player }>(`${baseUrl}/${id}`, {
      headers: authHeaders(),
    });
    return response.data;
  }

  async function createPlayer(payload: PlayerCreateDTO): Promise<Player> {
    const response = await $fetch<{ data: Player }>(baseUrl, {
      method: "POST",
      headers: authHeaders(),
      body: payload,
    });
    return response.data;
  }

  async function updatePlayer(
    id: string,
    payload: PlayerUpdateDTO,
  ): Promise<Player> {
    const response = await $fetch<{ data: Player }>(`${baseUrl}/${id}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: payload,
    });
    return response.data;
  }

  async function deletePlayer(id: string): Promise<void> {
    await $fetch(`${baseUrl}/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
  }

  return {
    players,
    loading,
    error,
    fetchPlayers,
    fetchPlayerById,
    createPlayer,
    updatePlayer,
    deletePlayer,
  };
}
