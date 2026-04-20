/**
 * Fetches the list of playgrounds for use in statistics filters.
 * Backed by GET /api/v1/playgrounds (public).
 *
 * Returns `availablePlaygrounds` as `{ value: string; label: string }[]`
 * sorted alphabetically by name.
 */
export function useStatisticsAvailablePlaygrounds(
  enabled: MaybeRef<boolean> = true,
) {
  const { $api } = useNuxtApp();
  const isEnabled = toRef(enabled);

  const { data } = useAsyncData(
    "statistics-available-playgrounds",
    () =>
      isEnabled.value
        ? $api<{ data: { id: string; name: string }[] }>("/api/v1/playgrounds")
        : Promise.resolve(null),
    { server: false, watch: [isEnabled] },
  );

  const availablePlaygrounds = computed(() => {
    return (data.value?.data ?? [])
      .map((p) => ({ value: p.id, label: p.name.trim() }))
      .sort((a, b) => a.label.localeCompare(b.label));
  });

  return { availablePlaygrounds };
}
