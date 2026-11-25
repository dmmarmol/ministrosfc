import {
  OPTION_FILTER_ALL,
  PlayerStatus,
  PlayerType,
  type PlayerPublic,
  type Position,
} from "@ministrosfc/shared";

export type RosterStatusFilter =
  | PlayerStatus
  | typeof OPTION_FILTER_ALL;

export function resolveRosterStatus(
  search: string,
  currentStatus: RosterStatusFilter,
): RosterStatusFilter {
  return search.trim() ? OPTION_FILTER_ALL : currentStatus;
}

export function filterRegisteredPlayers(
  players: readonly PlayerPublic[],
  search: string,
  position: Position | string,
  status: RosterStatusFilter,
): PlayerPublic[] {
  const query = search.trim().toLocaleLowerCase();
  return players.filter((player) => {
    if (player.playerType === PlayerType.GUEST) return false;
    if (status !== OPTION_FILTER_ALL && player.status !== status) return false;
    if (position && player.position !== position) return false;
    if (!query) return true;

    return [player.firstName, player.lastName, player.nickname]
      .filter(Boolean)
      .some((value) => value?.toLocaleLowerCase().includes(query));
  });
}
