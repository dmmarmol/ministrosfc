import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  PlayerStatus,
  PlayerType,
  type Player,
  type PlayerCreateDTO,
  type PlayerUpdateDTO,
} from "@ministrosfc/shared";
import { usePlayers } from "../usePlayers";

type FetchOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  body?: unknown;
  query?: Record<string, unknown>;
};
type FetchFunction = (
  url: string,
  options?: FetchOptions,
) => Promise<unknown>;

const mocks = vi.hoisted(() => ({
  fetch: vi.fn<FetchFunction>(),
}));

vi.mock("nuxt/app", () => ({
  useRuntimeConfig: () => ({ public: { apiBaseUrl: "https://cms.test" } }),
}));

vi.mock("~/stores/auth", () => ({
  useAuthStore: () => ({ accessToken: "test-access-token" }),
}));

function player(): Player {
  return {
    id: "player-1",
    firstName: "Ada",
    lastName: "Lovelace",
    nickname: null,
    address: null,
    playerType: PlayerType.REGISTERED,
    status: PlayerStatus.ACTIVE,
    invitedById: null,
    position: null,
    jerseyNumber: 8,
    dateOfBirth: null,
    height: null,
    dominantFoot: null,
    photoUrl: null,
    contactInfo: null,
    createdAt: "2026-10-01T10:00:00.000Z",
    updatedAt: "2026-10-01T10:00:00.000Z",
  };
}

describe("usePlayers", () => {
  beforeEach(() => {
    mocks.fetch.mockReset();
    vi.stubGlobal("$fetch", mocks.fetch);
  });

  it("lists players through the existing data/meta response envelope", async () => {
    const response = {
      data: [player()],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    };
    mocks.fetch.mockResolvedValue(response);
    const api = usePlayers();

    const result = await api.fetchPlayers({ status: PlayerStatus.ACTIVE });

    expect(mocks.fetch).toHaveBeenCalledWith(
      "https://cms.test/api/v1/players",
      expect.objectContaining({
        query: { status: PlayerStatus.ACTIVE },
      }),
    );
    expect(result.data[0]?.id).toBe("player-1");
    expect(api.players.value).toEqual(response.data);
  });

  it("creates and updates players with the shared DTOs and response envelope", async () => {
    const currentPlayer = player();
    const createPayload: PlayerCreateDTO = {
      firstName: "Ada",
      lastName: "Lovelace",
    };
    const updatePayload: PlayerUpdateDTO = { status: PlayerStatus.INACTIVE };
    mocks.fetch
      .mockResolvedValueOnce({ data: currentPlayer })
      .mockResolvedValueOnce({ data: currentPlayer });
    const api = usePlayers();

    await api.createPlayer(createPayload);
    await api.updatePlayer(currentPlayer.id, updatePayload);

    expect(mocks.fetch).toHaveBeenNthCalledWith(
      1,
      "https://cms.test/api/v1/players",
      expect.objectContaining({
        method: "POST",
        body: createPayload,
        headers: { Authorization: "Bearer test-access-token" },
      }),
    );
    expect(mocks.fetch).toHaveBeenNthCalledWith(
      2,
      "https://cms.test/api/v1/players/player-1",
      expect.objectContaining({ method: "PATCH", body: updatePayload }),
    );
  });

  it("deletes a player through the existing CMS endpoint", async () => {
    mocks.fetch.mockResolvedValue(undefined);
    const api = usePlayers();

    await api.deletePlayer("player-1");

    expect(mocks.fetch).toHaveBeenCalledWith(
      "https://cms.test/api/v1/players/player-1",
      expect.objectContaining({
        method: "DELETE",
        headers: { Authorization: "Bearer test-access-token" },
      }),
    );
  });
});
