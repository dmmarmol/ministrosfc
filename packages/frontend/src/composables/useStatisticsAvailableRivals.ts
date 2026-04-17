/**
 * Fetches the list of opponent teams for use in statistics filters.
 * Backed by GET /api/v1/teams (public).
 *
 * Returns `availableRivals` as `{ value: string; label: string }[]`
 * sorted alphabetically by name.
 */
export function useStatisticsAvailableRivals() {
  const { $api } = useNuxtApp();

  const { data } = useAsyncData(
    "statistics-available-rivals",
    () => $api<{ data: { id: string; name: string }[] }>("/api/v1/teams"),
    { server: false },
  );

  const availableRivals = computed(() => {
    return (data.value?.data ?? [])
      .map((t) => ({ value: t.id, label: t.name.trim() }))
      .sort((a, b) => a.label.localeCompare(b.label));
  });

  return { availableRivals };
}
