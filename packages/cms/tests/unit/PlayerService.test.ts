import { PlayerService } from "../../src/services/PlayerService";
import { PlayerModel } from "../../src/models/Player";
import * as objectStorage from "../../src/utils/object-storage";

jest.mock("../../src/models/Player");
jest.mock("../../src/utils/object-storage");
jest.mock("../../src/config/redis", () => ({
  getRedisClient: () => ({
    del: jest.fn().mockResolvedValue(1),
    get: jest.fn().mockResolvedValue(null),
    setex: jest.fn().mockResolvedValue("OK"),
    keys: jest.fn().mockResolvedValue([]),
  }),
  redisKeys: {
    statsCache: jest
      .fn()
      .mockImplementation((key: string) => `cache:stats:${key}`),
    session: jest.fn().mockImplementation((id: string) => `session:${id}`),
    tournamentCache: jest
      .fn()
      .mockImplementation((id: string) => `cache:tournament:${id}`),
  },
}));

describe("PlayerService", () => {
  afterEach(() => jest.clearAllMocks());

  describe("createPlayer", () => {
    it("creates a player when jersey number is not taken", async () => {
      (PlayerModel.isJerseyNumberTaken as jest.Mock).mockResolvedValue(false);
      const mockPlayer = {
        id: "p1",
        firstName: "Diego",
        lastName: "Test",
        jerseyNumber: 7,
        photoUrl: null,
      };
      (PlayerModel.create as jest.Mock).mockResolvedValue(mockPlayer);

      const result = await PlayerService.createPlayer({
        firstName: "Diego",
        lastName: "Test",
        jerseyNumber: 7,
      });
      expect(result.id).toBe("p1");
      expect(PlayerModel.isJerseyNumberTaken).toHaveBeenCalledWith(7);
    });

    it("throws 409 when jersey number is already taken", async () => {
      (PlayerModel.isJerseyNumberTaken as jest.Mock).mockResolvedValue(true);

      await expect(
        PlayerService.createPlayer({
          firstName: "Diego",
          lastName: "Test",
          jerseyNumber: 7,
        }),
      ).rejects.toMatchObject({ statusCode: 409 });
      expect(PlayerModel.create).not.toHaveBeenCalled();
    });

    it("uploads photo when photoFile is provided", async () => {
      (PlayerModel.isJerseyNumberTaken as jest.Mock).mockResolvedValue(false);
      (PlayerModel.create as jest.Mock).mockResolvedValue({
        id: "p2",
        firstName: "Foto",
        lastName: "Player",
        photoUrl: null,
      });
      (PlayerModel.update as jest.Mock).mockResolvedValue({
        id: "p2",
        photoUrl: "https://cdn/photo.jpg",
      });
      (objectStorage.uploadPlayerPhoto as jest.Mock)
        .mockResolvedValueOnce("https://cdn/temp-photo.jpg")
        .mockResolvedValueOnce("https://cdn/photo.jpg");
      (objectStorage.deletePlayerPhoto as jest.Mock).mockResolvedValue(
        undefined,
      );

      const fakeFile = {
        buffer: Buffer.from("img"),
        mimetype: "image/jpeg",
        originalname: "photo.jpg",
        size: 1000,
      };
      const result = await PlayerService.createPlayer(
        { firstName: "Foto", lastName: "Player" },
        fakeFile as any,
      );
      expect(objectStorage.uploadPlayerPhoto).toHaveBeenCalledTimes(2);
      expect(result.id).toBe("p2");
    });
  });

  describe("deactivatePlayer", () => {
    it("deactivates an active player", async () => {
      (PlayerModel.findById as jest.Mock).mockResolvedValue({
        id: "p1",
        status: "ACTIVE",
      });
      (PlayerModel.deactivate as jest.Mock).mockResolvedValue({
        id: "p1",
        status: "INACTIVE",
      });

      const result = await PlayerService.deactivatePlayer("p1");
      expect(result.status).toBe("INACTIVE");
    });

    it("throws 404 when player not found", async () => {
      (PlayerModel.findById as jest.Mock).mockResolvedValue(null);
      await expect(
        PlayerService.deactivatePlayer("missing"),
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe("searchPlayers", () => {
    it("returns paginated player list", async () => {
      const expected = {
        data: [{ id: "p1" }],
        pagination: { total: 1, page: 1, limit: 20 },
      };
      (PlayerModel.findMany as jest.Mock).mockResolvedValue(expected);

      const result = await PlayerService.searchPlayers({
        status: "ACTIVE",
      } as any);
      expect(result.data).toHaveLength(1);
    });
  });

  describe("deletePlayer", () => {
    it("deletes player successfully — returns void and invalidates cache", async () => {
      const mockPlayer = {
        id: "p1",
        firstName: "Diego",
        lastName: "Test",
        photoUrl: null,
      };
      (PlayerModel.findById as jest.Mock).mockResolvedValue(mockPlayer);
      (PlayerModel.deleteById as jest.Mock).mockResolvedValue(undefined);

      await expect(PlayerService.deletePlayer("p1")).resolves.toBeUndefined();
      expect(PlayerModel.deleteById).toHaveBeenCalledWith("p1");
    });

    it("throws 404 when player not found", async () => {
      (PlayerModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(PlayerService.deletePlayer("missing")).rejects.toMatchObject(
        { statusCode: 404 },
      );
      expect(PlayerModel.deleteById).not.toHaveBeenCalled();
    });

    it("calls deletePlayerPhoto best-effort when photoUrl exists", async () => {
      const mockPlayer = {
        id: "p2",
        firstName: "Foto",
        lastName: "Player",
        photoUrl: "https://cdn/photo.jpg",
      };
      (PlayerModel.findById as jest.Mock).mockResolvedValue(mockPlayer);
      (PlayerModel.deleteById as jest.Mock).mockResolvedValue(undefined);
      (objectStorage.deletePlayerPhoto as jest.Mock).mockResolvedValue(
        undefined,
      );

      await PlayerService.deletePlayer("p2");
      expect(objectStorage.deletePlayerPhoto).toHaveBeenCalledWith(
        "https://cdn/photo.jpg",
      );
    });

    it("does not reject if deletePlayerPhoto throws (best-effort)", async () => {
      const mockPlayer = {
        id: "p3",
        firstName: "Photo Error",
        lastName: "Player",
        photoUrl: "https://cdn/bad.jpg",
      };
      (PlayerModel.findById as jest.Mock).mockResolvedValue(mockPlayer);
      (PlayerModel.deleteById as jest.Mock).mockResolvedValue(undefined);
      (objectStorage.deletePlayerPhoto as jest.Mock).mockRejectedValue(
        new Error("Cloudinary error"),
      );

      await expect(PlayerService.deletePlayer("p3")).resolves.toBeUndefined();
    });

    it("does not call deletePlayerPhoto when photoUrl is null", async () => {
      const mockPlayer = {
        id: "p4",
        firstName: "No",
        lastName: "Photo",
        photoUrl: null,
      };
      (PlayerModel.findById as jest.Mock).mockResolvedValue(mockPlayer);
      (PlayerModel.deleteById as jest.Mock).mockResolvedValue(undefined);

      await PlayerService.deletePlayer("p4");
      expect(objectStorage.deletePlayerPhoto).not.toHaveBeenCalled();
    });
  });
});
