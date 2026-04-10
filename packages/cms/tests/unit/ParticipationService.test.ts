import { ParticipationService } from "../../src/services/ParticipationService";
import { prisma } from "../../src/config/database";
import { GameStatus } from "@ministrosfc/shared";

// ------------------------------------------------------------------
// shared mock factories
// ------------------------------------------------------------------

function makeGameRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "game-1",
    status: GameStatus.SCHEDULED,
    maxPlayers: 10,
    // minimal fields for the queries inside $transaction
    ...overrides,
  };
}

function makeParticipantRow() {
  return {
    id: "participant-1",
    gameId: "game-1",
    playerId: "player-1",
    confirmationStatus: "CONFIRMED" as const,
    confirmedById: "player-1",
    confirmedAt: new Date(),
    player: {
      id: "player-1",
      firstName: "Carlos",
      lastName: "Gomez",
      jerseyNumber: 10,
      position: "CF",
      playerType: "REGISTERED" as const,
      invitedById: null,
      invitedBy: null,
    },
    confirmedBy: null,
  };
}

// ------------------------------------------------------------------
// prisma mock — inline jest.fn() to avoid TDZ hoisting issues
// ------------------------------------------------------------------

jest.mock("../../src/config/database", () => ({
  prisma: {
    game: { findUnique: jest.fn() },
    gameParticipant: {
      findFirst: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    user: { findUnique: jest.fn() },
    $transaction: jest.fn(),
  },
}));

jest.mock("../../src/models/GameParticipant");
jest.mock("../../src/models/Player");

// Aliases resolved after jest.mock hoisting (prisma is already the mocked version here)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockDb = prisma as any;
const mockPrismaGameFindUnique: jest.Mock = mockDb.game.findUnique;
const mockPrismaGameParticipantFindFirst: jest.Mock = mockDb.gameParticipant.findFirst;
const mockPrismaGameParticipantDelete: jest.Mock = mockDb.gameParticipant.delete;
const mockPrismaUserFindUnique: jest.Mock = mockDb.user.findUnique;
const mockPrismaTransaction: jest.Mock = mockDb.$transaction;

// ------------------------------------------------------------------
// removeParticipant tests
// ------------------------------------------------------------------

describe("ParticipationService.removeParticipant", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrismaGameParticipantFindFirst.mockResolvedValue({ id: "participant-1", gameId: "game-1", playerId: "player-1" });
    mockPrismaGameFindUnique.mockResolvedValue(makeGameRow());
    mockPrismaGameParticipantDelete.mockResolvedValue({});
  });

  it("throws 403 when role is DT", async () => {
    await expect(
      ParticipationService.removeParticipant("game-1", "participant-1", "user-1", "DT"),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("throws 404 when participant is not found", async () => {
    mockPrismaGameParticipantFindFirst.mockResolvedValue(null);
    await expect(
      ParticipationService.removeParticipant("game-1", "missing-id", "user-1", "ADMIN"),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("throws 404 when game is not found", async () => {
    mockPrismaGameFindUnique.mockResolvedValue(null);
    await expect(
      ParticipationService.removeParticipant("game-1", "participant-1", "user-1", "ADMIN"),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("throws 403 when EDITOR tries to remove from non-SCHEDULED game", async () => {
    mockPrismaGameFindUnique.mockResolvedValue(makeGameRow({ status: "COMPLETED" }));
    await expect(
      ParticipationService.removeParticipant("game-1", "participant-1", "user-1", "EDITOR"),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("successfully deletes participant as ADMIN from any status", async () => {
    mockPrismaGameFindUnique.mockResolvedValue(makeGameRow({ status: "COMPLETED" }));
    await expect(
      ParticipationService.removeParticipant("game-1", "participant-1", "user-1", "ADMIN"),
    ).resolves.toBeUndefined();
    expect(mockPrismaGameParticipantDelete).toHaveBeenCalledWith({
      where: { id: "participant-1" },
    });
  });

  it("EDITOR can remove from SCHEDULED game", async () => {
    await expect(
      ParticipationService.removeParticipant("game-1", "participant-1", "user-1", "EDITOR"),
    ).resolves.toBeUndefined();
  });
});

// ------------------------------------------------------------------
// signupParticipant tests
// ------------------------------------------------------------------

describe("ParticipationService.signupParticipant", () => {
  const participantRow = makeParticipantRow();

  beforeEach(() => {
    jest.clearAllMocks();
    // $transaction executes its callback with a mock tx
    mockPrismaTransaction.mockImplementation(async (cb: any) => {
      const tx = {
        game: {
          findUnique: jest.fn().mockResolvedValue(makeGameRow()),
        },
        user: {
          findUnique: jest.fn().mockResolvedValue({ playerId: "player-1" }),
        },
        gameParticipant: {
          findFirst: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue(participantRow),
          findUnique: jest.fn().mockResolvedValue(participantRow),
          count: jest.fn().mockResolvedValue(1),
        },
        player: {
          findUnique: jest.fn().mockResolvedValue({
            id: "player-1",
            firstName: "Carlos",
            lastName: "Gomez",
          }),
        },
      };
      return cb(tx);
    });
    mockPrismaUserFindUnique.mockResolvedValue({ playerId: "player-1" });
  });

  it("throws 404 when requesting user has no linked player", async () => {
    mockPrismaUserFindUnique.mockResolvedValue({ playerId: null });
    await expect(
      ParticipationService.signupParticipant("game-1", "user-no-player", {
        mode: "self",
      }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("throws when game is not found inside transaction", async () => {
    mockPrismaTransaction.mockImplementation(async (cb: any) => {
      const tx = {
        game: { findUnique: jest.fn().mockResolvedValue(null) },
        user: { findUnique: jest.fn().mockResolvedValue({ playerId: "player-1" }) },
        gameParticipant: {
          findFirst: jest.fn().mockResolvedValue(null),
          create: jest.fn(),
          findUnique: jest.fn(),
          count: jest.fn().mockResolvedValue(0),
        },
        player: { findUnique: jest.fn() },
      };
      return cb(tx);
    });
    await expect(
      ParticipationService.signupParticipant("missing-game", "user-1", {
        mode: "self",
      }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("throws 409 when game is full on self signup", async () => {
    mockPrismaTransaction.mockImplementation(async (cb: any) => {
      const tx = {
        game: {
          findUnique: jest.fn().mockResolvedValue(
            makeGameRow({ maxPlayers: 1 }),
          ),
        },
        user: { findUnique: jest.fn().mockResolvedValue({ playerId: "player-1" }) },
        gameParticipant: {
          findFirst: jest.fn().mockResolvedValue(null),
          create: jest.fn(),
          findUnique: jest.fn(),
          count: jest.fn().mockResolvedValue(1), // count equals maxPlayers
        },
        player: { findUnique: jest.fn() },
      };
      return cb(tx);
    });
    await expect(
      ParticipationService.signupParticipant("game-1", "user-1", {
        mode: "self",
      }),
    ).rejects.toMatchObject({ statusCode: 422 });
  });
});
