/**
 * Fetches the list of opponent teams for use in statistics filters.
 * Backed by GET /api/v1/teams (public).
 *
 * Returns `availableRivals` as `{ value: string; label: string }[]`
 * sorted alphabetically by name.
 */
export function useStatisticsAvailableRivals(enabled: MaybeRef<boolean> = true) {
  const { $api } = useNuxtApp();
  const isEnabled = toRef(enabled);

  const { data } = useAsyncData(
    "statistics-available-rivals",
    () =>
      isEnabled.value
        ? $api<{ data: { id: string; name: string }[] }>("/api/v1/teams")
        : Promise.resolve(null),
    { server: false, watch: [isEnabled] },
  );

  const availableRivals = computed(() => {
    return (data.value?.data ?? [])
      .map((t) => ({ value: t.id, label: t.name.trim() }))
      .sort((a, b) => a.label.localeCompare(b.label));
  });

  return { availableRivals };
}
