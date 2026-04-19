import { computed, toRef } from "vue";
import type { MaybeRef } from "vue";

/**
 * Fetches the global list of years that have completed game data.
 * Backed by GET /api/v1/statistics/years (public, cached 5 min).
 *
 * Returns `availableYears` as `{ value: string; label: string }[]`
 * ready to be passed directly to StatsFilters :years prop.
 */
export function useStatisticsAvailableYears(enabled: MaybeRef<boolean> = true) {
  const { $api } = useNuxtApp();
  const isEnabled = toRef(enabled);

  const { data } = useAsyncData(
    "statistics-available-years",
    () =>
      isEnabled.value
        ? $api<{ data: number[] }>("/api/v1/statistics/years")
        : Promise.resolve(null),
    { server: false, watch: [isEnabled] },
  );

  const availableYears = computed(() =>
    (data.value?.data ?? []).map((y) => ({
      value: String(y),
      label: String(y),
    })),
  );

  return { availableYears };
}
