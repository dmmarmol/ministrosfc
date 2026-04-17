/**
 * Fetches the list of players for use in statistics filters.
 * Backed by GET /api/v1/players (public, large limit to avoid pagination).
 *
 * Returns `availablePlayers` as `{ value: string; label: string }[]`
 * sorted alphabetically by display name.
 */
export function useStatisticsAvailablePlayers() {
  const { $api } = useNuxtApp();

  const { data } = useAsyncData(
    "statistics-available-players",
    () =>
      $api<{
        data: {
          id: string;
          firstName: string;
          lastName: string;
          nickname?: string | null;
        }[];
      }>("/api/v1/players", { query: { limit: 200 } }),
    { server: false },
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
