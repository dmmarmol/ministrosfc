import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";

export interface StatsFilters {
  mode: string;
  year: string;
  tournament: string;
  rivalId: string;
  playerId: string;
  playgroundId: string;
}

export function useStatsFilters() {
  const route = useRoute();
  const router = useRouter();

  const filters = computed<StatsFilters>(() => ({
    mode: (route.query.mode as string) ?? "",
    year: (route.query.year as string) ?? "",
    tournament: (route.query.tournament as string) ?? "",
    rivalId: (route.query.rivalId as string) ?? "",
    playerId: (route.query.playerId as string) ?? "",
    playgroundId: (route.query.playgroundId as string) ?? "",
  }));

  async function setFilter(key: keyof StatsFilters, value: string) {
    const query: Record<string, string | undefined> = {
      ...(route.query as Record<string, string>),
      [key]: value || undefined,
    };
    // Remove empty values
    Object.keys(query).forEach((k) => {
      if (!query[k]) delete query[k];
    });
    await router.push({ query });
  }

  async function resetFilters() {
    await router.push({ query: {} });
  }

  return { filters, setFilter, resetFilters };
}
