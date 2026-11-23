import { beforeEach, describe, expect, it } from "vitest";
import {
  attachCreatedTeamToGameDraft,
  consumeGameCreationDraft,
  saveGameCreationDraft,
} from "~/utils/gameCreationDraft";

describe("game draft return from team creation", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("restores game fields and participant identifiers and consumes the draft once", () => {
    saveGameCreationDraft({
      opponentTeamId: "old-team",
      date: "2026-11-15",
      time: "16:00",
      playgroundId: "pitch-1",
      maxPlayers: 18,
      competitionType: "FRIENDLY",
      tournamentId: "tournament-1",
      participantIds: ["player-1", "player-2"],
      returnUrl: "/admin/tournaments",
    });
    attachCreatedTeamToGameDraft("new-team");

    expect(consumeGameCreationDraft()).toEqual({
      opponentTeamId: "old-team",
      date: "2026-11-15",
      time: "16:00",
      playgroundId: "pitch-1",
      maxPlayers: 18,
      competitionType: "FRIENDLY",
      tournamentId: "tournament-1",
      participantIds: ["player-1", "player-2"],
      newOpponentTeamId: "new-team",
      returnUrl: "/admin/tournaments",
    });
    expect(consumeGameCreationDraft()).toBeNull();
  });

  it("ignores and clears malformed session drafts", () => {
    sessionStorage.setItem("admin-game-creation-draft", "{");

    expect(consumeGameCreationDraft()).toBeNull();
    expect(
      sessionStorage.getItem("admin-game-creation-draft"),
    ).toBeNull();
  });

});
