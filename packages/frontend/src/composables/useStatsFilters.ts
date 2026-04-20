import { computed } from "vue";
import { useRouter } from "vue-router";
import { PlayerStatus } from "@ministrosfc/shared";

export interface StatsFilters {
  mode: string;
  year: string;
  tournament: string;
  rivalId: string;
  playerId: string;
  playerStatus: string;
  playgroundId: string;
}

export function useStatsFilters() {
  const router = useRouter();
  const qp = useQueryParams();

  function makeFilter(key: keyof StatsFilters, defaultValue = "") {
    return computed({
      get: () => qp.get(key) || defaultValue,
      set: (v: string) => qp.set(key, v),
    });
  }

  const filters = computed<StatsFilters>(() => ({
    mode: qp.get("mode"),
    year: qp.get("year"),
    tournament: qp.get("tournament"),
    rivalId: qp.get("rivalId"),
    playerId: qp.get("playerId"),
    playerStatus: qp.get("playerStatus") || PlayerStatus.ACTIVE,
    playgroundId: qp.get("playgroundId"),
  }));

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
    year,
    tournament,
    rivalId,
    playerId,
    playerStatus,
    playgroundId,
  };
}
