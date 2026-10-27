import { toRef, type MaybeRef } from "vue";
import type { SelectItem } from "#ui/components/Select.vue";

/**
 * Fetches the list of tournaments for use in statistics filters.
 * Backed by GET /api/v1/tournaments (public, cached 5 min).
 *
 * Returns `availableTournaments` as `{ value: string; label: string }[]`
 * deduplicated by name — tournaments sharing the same name (e.g. multiple
 * "Amistoso" editions) appear as a single option whose value is the name itself.
 */
export function useStatisticsAvailableTournaments(
  enabled: MaybeRef<boolean> = true,
) {
  const { $api } = useNuxtApp();
  const isEnabled = toRef(enabled);

  const { data } = useAsyncData(
    "statistics-available-tournaments",
    () =>
      isEnabled.value
        ? $api<{ data: { id: string; name: string }[] }>("/api/v1/tournaments")
        : Promise.resolve(null),
    { server: false, watch: [isEnabled] },
  );

  const availableTournaments = computed((): SelectItem[] => {
    return (
      data.value?.data.map((item) => {
        return {
          item,
          value: item.id,
          label: item.name,
        };
      }) ?? []
    );
  });

  return { availableTournaments };
}
