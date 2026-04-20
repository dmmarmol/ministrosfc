import { computed } from "vue";
import { useNuxtApp, useAsyncData } from "nuxt/app";
import { toValue, type MaybeRefOrGetter } from "vue";

export interface PlayerStats {
  appearances: number;
  goalsScored: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  totalMinutes: number;
}

export interface PlayerStatsResponse {
  player: Record<string, unknown>;
  stats: PlayerStats;
  availableYears: number[];
}

export function useGetPlayerStatsById(
  id: string,
  options: { year?: MaybeRefOrGetter<string | undefined> } = {},
) {
  const { $api } = useNuxtApp();

  const { data, pending, error, refresh } = useAsyncData(
    `player-stats-${id}`,
    () => {
      const year = toValue(options.year);
      const url = year
        ? `/api/v1/statistics/players/${id}?year=${year}`
        : `/api/v1/statistics/players/${id}`;
      return $api<{ data: PlayerStatsResponse }>(url);
    },
    { watch: options.year ? [() => toValue(options.year)] : [] },
  );

  const stats = computed<PlayerStats | null>(
    () => data.value?.data?.stats ?? null,
  );

  const availableYears = computed<number[]>(
    () => data.value?.data?.availableYears ?? [],
  );

  return { stats, availableYears, pending, error, refresh };
}
