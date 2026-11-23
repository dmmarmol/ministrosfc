import { describe, expect, it } from "vitest";
import {
  OPTION_FILTER_ALL,
  PlayerStatus,
  PlayerType,
} from "@ministrosfc/shared";
import {
  filterRegisteredPlayers,
  resolveRosterStatus,
} from "~/utils/roster";
import type { PlayerPublic } from "@ministrosfc/shared";

function player(
  id: string,
  status: PlayerStatus,
  playerType = PlayerType.REGISTERED,
): PlayerPublic {
  return {
    id,
    firstName: id,
    lastName: "Player",
    nickname: null,
    position: null,
    jerseyNumber: null,
    photoUrl: null,
    status,
    playerType,
  };
}

describe("public roster filtering", () => {
  const players = [
    player("active-match", PlayerStatus.ACTIVE),
    player("inactive-match", PlayerStatus.INACTIVE),
    player("guest-match", PlayerStatus.ACTIVE, PlayerType.GUEST),
  ];

  it("searches registered players across statuses and excludes guests", () => {
    expect(
      filterRegisteredPlayers(players, "match", "", OPTION_FILTER_ALL),
    ).toEqual([players[0], players[1]]);
  });

  it("retains a selected status when no search is active", () => {
    expect(
      filterRegisteredPlayers(players, "", "", PlayerStatus.INACTIVE),
    ).toEqual([players[1]]);
  });

  it("switches to Todos during search and retains it after clearing search", () => {
    const searching = resolveRosterStatus("match", PlayerStatus.INACTIVE);

    expect(searching).toBe(OPTION_FILTER_ALL);
    expect(resolveRosterStatus("", searching)).toBe(OPTION_FILTER_ALL);
  });
});
