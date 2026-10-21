import { ref } from "vue";
import { useRuntimeConfig } from "nuxt/app";
import { useAuthStore } from "~/stores/auth";
import type {
  OpponentTeam,
  OpponentTeamCreatePayload,
  OpponentTeamUpdatePayload,
} from "@ministrosfc/shared";

export function useOpponentTeams() {
  const config = useRuntimeConfig();
  const authStore = useAuthStore();

  const opponentTeams = ref<OpponentTeam[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const baseUrl = `${config.public.apiBaseUrl}/api/v1/opponent-teams`;

  function authHeaders() {
    return { Authorization: `Bearer ${authStore.accessToken}` };
  }

  async function fetchOpponentTeam(id: string): Promise<OpponentTeam> {
    loading.value = true;
    error.value = null;
    try {
      const res = await $fetch<{ data: OpponentTeam }>(`${baseUrl}/${id}`);
      return res.data;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Error al cargar equipos";
    } finally {
      loading.value = false;
    }
    throw new Error(error.value ?? "Error al cargar el equipo.");
  }

  async function fetchOpponentTeams(): Promise<OpponentTeam[]> {
    loading.value = true;
    error.value = null;
    try {
      const res = await $fetch<{ data: OpponentTeam[] }>(baseUrl);
      opponentTeams.value = res.data;
      return res.data;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Error al cargar canchas";
      return [];
    } finally {
      loading.value = false;
    }
  }

  async function createOpponentTeam(
    payload: OpponentTeamCreatePayload,
  ): Promise<OpponentTeam> {
    const res = await $fetch<{ data: OpponentTeam }>(baseUrl, {
      method: "POST",
      headers: authHeaders(),
      body: payload,
    });
    await fetchOpponentTeams();
    return res.data;
  }

  async function updateOpponentTeam(
    id: string,
    payload: OpponentTeamUpdatePayload,
  ): Promise<void> {
    await $fetch(`${baseUrl}/${id}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: payload,
    });
    await fetchOpponentTeams();
  }

  async function deleteOpponentTeam(id: string): Promise<void> {
    await $fetch(`${baseUrl}/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    await fetchOpponentTeams();
  }

  return {
    opponentTeams,
    loading,
    error,
    fetchOpponentTeam,
    fetchOpponentTeams,
    createOpponentTeam,
    updateOpponentTeam,
    deleteOpponentTeam,
  };
}
