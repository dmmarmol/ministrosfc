import { describe, it, expect, vi, beforeEach } from "vitest";
import { ref } from "vue";
import { setActivePinia, createPinia } from "pinia";
import { GameStatus } from "@ministrosfc/shared";

// ------------------------------------------------------------------
// Mock nuxt/app before importing the composable
// ------------------------------------------------------------------
const mockApi = vi.fn();

vi.mock("nuxt/app", () => ({
  useNuxtApp: () => ({ $api: mockApi }),
}));

// Import AFTER mocks are wired
const { useGameSignup } = await import("../useGameSignup");

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------
function makeDTO(overrides: Record<string, unknown> = {}) {
  return {
    game: {
      id: "game-1",
      slug: "2026-04-15-racing-club",
      date: "2026-04-15T14:00:00.000Z",
      location: null,
      status: GameStatus.SCHEDULED,
      maxPlayers: 10,
      lineup: null,
      opponentTeam: { id: "team-1", name: "Racing Club" },
      playground: null,
    },
    roster: [],
    confirmedCount: 0,
    isFull: false,
    currentPlayerStatus: "not_signed_up" as const,
    currentPlayerId: "player-1",
    ...overrides,
  };
}

// ------------------------------------------------------------------
// Tests
// ------------------------------------------------------------------
describe("useGameSignup", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it("starts with null game and loading=false", () => {
    const { game, loading, error } = useGameSignup(ref("game-1"));
    expect(game.value).toBeNull();
    expect(loading.value).toBe(false);
    expect(error.value).toBeNull();
  });

  it("load() populates game, roster, confirmedCount and isFull from API", async () => {
    const dto = makeDTO({ confirmedCount: 3, isFull: false });
    mockApi.mockResolvedValueOnce({ data: dto });

    const { load, game, confirmedCount, isFull } = useGameSignup(ref("game-1"));
    await load();

    expect(game.value).toMatchObject({ id: "game-1" });
    expect(confirmedCount.value).toBe(3);
    expect(isFull.value).toBe(false);
  });

  it("load() sets error when API rejects", async () => {
    mockApi.mockRejectedValueOnce(new Error("Network error"));

    const { load, error } = useGameSignup(ref("game-1"));
    await load();

    expect(error.value).toBeTruthy();
  });

  it("signupSelf() calls the self signup endpoint and updates roster", async () => {
    const dto = makeDTO();
    mockApi.mockResolvedValueOnce({ data: dto }); // initial load

    const rosterEntry = {
      participantId: "p-1",
      confirmationStatus: "CONFIRMED",
      confirmedById: "player-1",
      confirmedByName: null,
      confirmedAt: new Date().toISOString(),
      player: {
        id: "player-1",
        firstName: "Carlos",
        lastName: "Gomez",
        jerseyNumber: 10,
        position: "CF",
        playerType: "REGISTERED",
        invitedById: null,
        invitedByName: null,
      },
    };
    mockApi.mockResolvedValueOnce({
      data: { entry: rosterEntry, confirmedCount: 1, isFull: false },
    }); // signupSelf

    const { load, signupSelf, roster, confirmedCount } = useGameSignup(
      ref("game-1"),
    );
    await load();
    await signupSelf();

    expect(confirmedCount.value).toBe(1);
    expect(roster.value).toHaveLength(1);
    expect(roster.value[0]!.participantId).toBe("p-1");
  });

  it("signupGuest() calls the guest signup endpoint with correct payload", async () => {
    const dto = makeDTO();
    mockApi.mockResolvedValueOnce({ data: dto }); // load

    const rosterEntry = {
      participantId: "p-guest",
      confirmationStatus: "CONFIRMED",
      confirmedById: "player-1",
      confirmedByName: null,
      confirmedAt: new Date().toISOString(),
      player: {
        id: "player-guest",
        firstName: "Juan",
        lastName: "Perez",
        jerseyNumber: null,
        position: null,
        playerType: "GUEST",
        invitedById: "player-1",
        invitedByName: "Carlos Gomez",
      },
    };
    mockApi.mockResolvedValueOnce({
      data: { entry: rosterEntry, confirmedCount: 1, isFull: false },
    });

    const { load, signupGuest, roster } = useGameSignup(ref("game-1"));
    await load();
    await signupGuest("Juan", "Perez", null);

    expect(mockApi).toHaveBeenLastCalledWith(
      expect.stringContaining("/signup"),
      expect.objectContaining({
        method: "POST",
        body: {
          mode: "guest",
          firstName: "Juan",
          lastName: "Perez",
          position: null,
        },
      }),
    );
    expect(roster.value).toHaveLength(1);
  });

  it("signupProxy() calls the proxy signup endpoint with correct targetPlayerId", async () => {
    const dto = makeDTO();
    mockApi.mockResolvedValueOnce({ data: dto }); // load
    mockApi.mockResolvedValueOnce({
      data: {
        entry: {
          participantId: "p-proxy",
          confirmationStatus: "CONFIRMED",
          confirmedById: "player-1",
          confirmedByName: null,
          confirmedAt: new Date().toISOString(),
          player: {
            id: "player-proxy",
            firstName: "Lucas",
            lastName: "Diaz",
            jerseyNumber: null,
            position: null,
            playerType: "REGISTERED",
            invitedById: null,
            invitedByName: null,
          },
        },
        confirmedCount: 1,
        isFull: false,
      },
    });

    const { load, signupProxy } = useGameSignup(ref("game-1"));
    await load();
    await signupProxy("target-player-id");

    expect(mockApi).toHaveBeenLastCalledWith(
      expect.stringContaining("/signup"),
      expect.objectContaining({
        method: "POST",
        body: { mode: "proxy", targetPlayerId: "target-player-id" },
      }),
    );
  });

  it("unregisterSelf() calls DELETE /participants/self, removes own roster entry and decrements count", async () => {
    const rosterEntry = {
      participantId: "p-self",
      confirmationStatus: "CONFIRMED" as const,
      confirmedById: "player-1",
      confirmedByName: null,
      confirmedAt: new Date().toISOString(),
      player: {
        id: "player-1",
        firstName: "Carlos",
        lastName: "Gomez",
        jerseyNumber: 10,
        position: "CF",
        playerType: "REGISTERED" as const,
        invitedById: null,
        invitedByName: null,
      },
    };
    const dto = makeDTO({
      roster: [rosterEntry],
      confirmedCount: 1,
      currentPlayerStatus: "signed_up",
      currentPlayerId: "player-1",
    });
    mockApi.mockResolvedValueOnce({ data: dto }); // load
    mockApi.mockResolvedValueOnce(undefined); // DELETE /self → 204

    const {
      load,
      unregisterSelf,
      roster,
      confirmedCount,
      currentPlayerStatus,
    } = useGameSignup(ref("game-1"));
    await load();
    await unregisterSelf();

    expect(mockApi).toHaveBeenLastCalledWith(
      expect.stringContaining("/participants/self"),
      expect.objectContaining({ method: "DELETE" }),
    );
    expect(roster.value).toHaveLength(0);
    expect(confirmedCount.value).toBe(0);
    expect(currentPlayerStatus.value).toBe("not_signed_up");
  });

  it("unregisterSelf() on 422 sets error and leaves roster unchanged", async () => {
    const rosterEntry = {
      participantId: "p-self",
      confirmationStatus: "CONFIRMED" as const,
      confirmedById: "player-1",
      confirmedByName: null,
      confirmedAt: new Date().toISOString(),
      player: {
        id: "player-1",
        firstName: "Carlos",
        lastName: "Gomez",
        jerseyNumber: 10,
        position: "CF",
        playerType: "REGISTERED" as const,
        invitedById: null,
        invitedByName: null,
      },
    };
    const dto = makeDTO({
      roster: [rosterEntry],
      confirmedCount: 1,
      currentPlayerStatus: "signed_up",
      currentPlayerId: "player-1",
    });
    mockApi.mockResolvedValueOnce({ data: dto }); // load
    mockApi.mockRejectedValueOnce({
      statusCode: 422,
      message: "Game is not open for unregistration",
    });

    const { load, unregisterSelf, roster, error } = useGameSignup(
      ref("game-1"),
    );
    await load();
    await unregisterSelf();

    expect(error.value).toBeTruthy();
    expect(roster.value).toHaveLength(1);
  });
});
