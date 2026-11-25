import { ref } from "vue";
import { useRuntimeConfig } from "nuxt/app";
import { useAuthStore } from "~/stores/auth";
import type {
  OpponentTeam,
  OpponentTeamCreatePayload,
  OpponentTeamUpdatePayload,
} from "@ministrosfc/shared";

const TEAMS_PAGE_SIZE = 100;

export function useOpponentTeams() {
  const { t } = useI18n();
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
        err instanceof Error ? err.message : t("errors.errorAlCargarEquipos");
    } finally {
      loading.value = false;
    }
    throw new Error(error.value ?? t("errors.errorAlCargarElEquipo"));
  }

  async function fetchOpponentTeams(): Promise<OpponentTeam[]> {
    loading.value = true;
    error.value = null;
    try {
      // The API paginates (default 20), so walk every page to expose all teams.
      const all: OpponentTeam[] = [];
      let page = 1;
      let totalPages = 1;
      do {
        const res = await $fetch<{
          data: OpponentTeam[];
          meta?: { totalPages?: number };
        }>(baseUrl, { query: { page, limit: TEAMS_PAGE_SIZE } });
        all.push(...res.data);
        totalPages = res.meta?.totalPages ?? 1;
        page += 1;
      } while (page <= totalPages);
      opponentTeams.value = all;
      return all;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : t("errors.errorAlCargarCanchas");
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
