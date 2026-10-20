import { ref } from "vue";
import { useRuntimeConfig } from "nuxt/app";
import { useAuthStore } from "~/stores/auth";
import type {
  Tournament,
  TournamentCreatePayload,
  TournamentUpdatePayload,
} from "@ministrosfc/shared";

export function useTournaments() {
  const config = useRuntimeConfig();
  const authStore = useAuthStore();

  const tournaments = ref<Tournament[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const baseUrl = `${config.public.apiBaseUrl}/api/v1/tournaments`;

  function authHeaders() {
    return { Authorization: `Bearer ${authStore.accessToken}` };
  }

  async function fetchTournament(id: string): Promise<Tournament> {
    loading.value = true;
    error.value = null;
    try {
      const res = await $fetch<{ data: Tournament }>(`${baseUrl}/${id}`);
      return res.data;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Error al cargar canchas";
    } finally {
      loading.value = false;
    }
    throw new Error(error.value ?? "Error al cargar el torneo.");
  }

  async function fetchTournaments(): Promise<Tournament[]> {
    loading.value = true;
    error.value = null;
    try {
      const res = await $fetch<{ data: Tournament[] }>(baseUrl);
      tournaments.value = res.data;
      return res.data;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Error al cargar canchas";
      return [];
    } finally {
      loading.value = false;
    }
  }

  async function createTournament(
    payload: TournamentCreatePayload,
  ): Promise<Tournament> {
    const res = await $fetch<{ data: Tournament }>(baseUrl, {
      method: "POST",
      headers: authHeaders(),
      body: payload,
    });
    await fetchTournaments();
    return res.data;
  }

  async function updateTournament(
    id: string,
    payload: TournamentUpdatePayload,
  ): Promise<void> {
    await $fetch(`${baseUrl}/${id}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: payload,
    });
    await fetchTournaments();
  }

  async function deleteTournament(id: string): Promise<void> {
    await $fetch(`${baseUrl}/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    await fetchTournaments();
  }

  return {
    tournaments,
    loading,
    error,
    fetchTournament,
    fetchTournaments,
    createTournament,
    updateTournament,
    deleteTournament,
  };
}
