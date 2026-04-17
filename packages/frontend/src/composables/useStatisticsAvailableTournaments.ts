/**
 * Fetches the list of tournaments for use in statistics filters.
 * Backed by GET /api/v1/tournaments (public, cached 5 min).
 *
 * Returns `availableTournaments` as `{ value: string; label: string }[]`
 * deduplicated by name — tournaments sharing the same name (e.g. multiple
 * "Amistoso" editions) appear as a single option whose value is the name itself.
 */
export function useStatisticsAvailableTournaments() {
  const { $api } = useNuxtApp();

  const { data } = useAsyncData(
    "statistics-available-tournaments",
    () => $api<{ data: { id: string; name: string }[] }>("/api/v1/tournaments"),
    { server: false },
  );

  const availableTournaments = computed(() => {
    const seen = new Set<string>();
    const result: { value: string; label: string }[] = [];
    for (const t of data.value?.data ?? []) {
      const key = t.name.trim().toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        result.push({ value: t.name.trim(), label: t.name.trim() });
      }
    }
    return result;
  });

  return { availableTournaments };
}
