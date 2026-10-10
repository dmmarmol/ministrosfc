import type { OrphanPlayerItem } from "@ministrosfc/shared";
import { useQueryParams } from "~/composables/useQueryParams";

export interface OrphanPlayersQuery {
  page?: number;
  limit?: number;
  search?: string;
}

export function useGetOrphanPlayers() {
  const { $api } = useNuxtApp();
  const queryParams = useQueryParams();

  function buildQueryString(query: OrphanPlayersQuery = {}): string {
    const params = new URLSearchParams();

    const parsePositiveInt = (raw: string, fallback: number): number => {
      const parsed = Number(raw);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
    };

    const routePage = parsePositiveInt(queryParams.get("page"), 1);
    const routeLimit = parsePositiveInt(queryParams.get("limit"), 20);

    const page = query.page ?? routePage;
    const limit = query.limit ?? routeLimit;
    const search = query.search ?? queryParams.get("search");

    params.set("page", String(page));
    params.set("limit", String(limit));

    const normalizedSearch = search?.trim();
    if (normalizedSearch) {
      params.set("search", normalizedSearch);
    }

    return params.toString();
  }

  async function fetchGlobalOrphanPlayers(
    query: OrphanPlayersQuery = {},
  ): Promise<OrphanPlayerItem[]> {
    const queryString = buildQueryString(query);
    const response = await ($api as any)(
      `/api/v1/admin/users/orphan-players?${queryString}`,
    );

    return response.data ?? [];
  }

  async function fetchPendingUserOrphanPlayers(
    userId: string,
    query: OrphanPlayersQuery = {},
  ): Promise<OrphanPlayerItem[]> {
    const queryString = buildQueryString(query);
    const response = await ($api as any)(
      `/api/v1/admin/users/pending-approvals/${userId}/orphan-players?${queryString}`,
    );

    return response.data ?? [];
  }

  return {
    fetchGlobalOrphanPlayers,
    fetchPendingUserOrphanPlayers,
  };
}
