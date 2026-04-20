/**
 * Fetches the list of players for use in statistics filters.
 * Backed by GET /api/v1/players (public, large limit to avoid pagination).
 *
 * Returns `availablePlayers` as `{ value: string; label: string }[]`
 * sorted alphabetically by display name.
 */
import { PlayerStatus } from "@ministrosfc/shared";
import type { MaybeRef } from "vue";

export function useStatisticsAvailablePlayers(
  status?: MaybeRef<string | undefined>,
  enabled: MaybeRef<boolean> = true,
) {
  const { $api } = useNuxtApp();

  const statusRef = toRef(status);
  const isEnabled = toRef(enabled);

  const queryStatus = computed<PlayerStatus | undefined>(() => {
    const value = statusRef.value;
    if (!value) return PlayerStatus.ACTIVE;
    if (value === PlayerStatus.ACTIVE || value === PlayerStatus.INACTIVE) {
      return value;
    }
    return undefined;
  });

  const { data } = useAsyncData(
    () => `statistics-available-players-${queryStatus.value ?? "all"}`,
    async () => {
      if (!isEnabled.value) return Promise.resolve(null);

      const fetchPlayers = (status?: PlayerStatus) =>
        $api<{
          data: {
            id: string;
            firstName: string;
            lastName: string;
            nickname?: string | null;
          }[];
        }>("/api/v1/players", {
          query: {
            limit: 200,
            ...(status ? { status } : {}),
          },
        });

      if (queryStatus.value) {
        return fetchPlayers(queryStatus.value);
      }

      const [activePlayers, inactivePlayers] = await Promise.all([
        fetchPlayers(PlayerStatus.ACTIVE),
        fetchPlayers(PlayerStatus.INACTIVE),
      ]);

      const mergedById = new Map<string, (typeof activePlayers.data)[number]>();
      for (const player of activePlayers.data)
        mergedById.set(player.id, player);
      for (const player of inactivePlayers.data)
        mergedById.set(player.id, player);

      return { data: [...mergedById.values()] };
    },
    { server: false, watch: [queryStatus, isEnabled] },
  );

  const availablePlayers = computed(() => {
    return (data.value?.data ?? [])
      .map((p) => ({
        value: p.id,
        label: `${p.firstName} ${p.lastName}`.trim(),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  });

  return { availablePlayers };
}
