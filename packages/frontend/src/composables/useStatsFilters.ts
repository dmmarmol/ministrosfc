import { computed } from "vue";
import { OPTION_FILTER_ALL, PlayerStatus } from "@ministrosfc/shared";
import { useQueryParams } from "~/composables/useQueryParams";

type PlayerStatusFilter = PlayerStatus | typeof OPTION_FILTER_ALL;

export interface StatsFilters {
  playerSearch: string;
  mode: string;
  year: string;
  tournament: string;
  rivalId: string;
  playerId: string;
  playerStatus: PlayerStatusFilter;
  playgroundId: string;
}

export function useStatsFilters() {
  const qp = useQueryParams();

  function makeFilter(key: keyof StatsFilters, defaultValue = "") {
    return computed({
      get: () => qp.get(key) || defaultValue,
      set: (v: string) => {
        if (!v || v === OPTION_FILTER_ALL) {
          return qp.remove(key);
        }
        return qp.set(key, v);
      },
    });
  }

  const filters = computed<StatsFilters>(() => ({
    playerSearch: qp.get("playerSearch") ?? "",
    mode: qp.get("mode") ?? "",
    year: qp.get("year") ?? "",
    tournament: qp.get("tournament") ?? "",
    rivalId: qp.get("rivalId") ?? "",
    playerId: qp.get("playerId") ?? "",
    playerStatus:
      (qp.get("playerStatus") as PlayerStatusFilter) || PlayerStatus.ACTIVE,
    playgroundId: qp.get("playgroundId") ?? "",
  }));

  const playerSearch = makeFilter("playerSearch");
  const year = makeFilter("year");
  const tournament = makeFilter("tournament");
  const rivalId = makeFilter("rivalId");
  const playerId = makeFilter("playerId");
  const playerStatus = makeFilter("playerStatus", PlayerStatus.ACTIVE);
  const playgroundId = makeFilter("playgroundId");

  async function setFilter(key: keyof StatsFilters, value: string) {
    await qp.set(key, value);
  }

  async function resetFilters() {
    await qp.reset();
  }

  return {
    filters,
    setFilter,
    resetFilters,
    playerSearch,
    year,
    tournament,
    rivalId,
    playerId,
    playerStatus,
    playgroundId,
  };
}
