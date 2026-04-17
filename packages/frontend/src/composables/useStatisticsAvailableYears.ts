import { computed } from "vue";

/**
 * Fetches the global list of years that have completed game data.
 * Backed by GET /api/v1/statistics/years (public, cached 5 min).
 *
 * Returns `availableYears` as `{ value: string; label: string }[]`
 * ready to be passed directly to StatsFilters :years prop.
 */
export function useStatisticsAvailableYears() {
  const { $api } = useNuxtApp();

  const { data } = useAsyncData(
    "statistics-available-years",
    () => $api<{ data: number[] }>("/api/v1/statistics/years"),
    { server: false },
  );

  const availableYears = computed(() =>
    (data.value?.data ?? []).map((y) => ({
      value: String(y),
      label: String(y),
    })),
  );

  return { availableYears };
}
