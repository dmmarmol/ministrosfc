import { PlaygroundService } from "../../src/services/PlaygroundService";
import { PlaygroundModel } from "../../src/models/Playground";

jest.mock("../../src/models/Playground");
jest.mock("../../src/config/redis", () => ({
  getRedisClient: () => ({
    get: jest.fn().mockResolvedValue(null),
    setex: jest.fn().mockResolvedValue("OK"),
    del: jest.fn().mockResolvedValue(1),
  }),
}));

// Mock global fetch used by Nominatim geocoding
const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockPlayground = {
  id: "pg-1",
  name: "Cancha Norte",
  address: "Av. Corrientes 1234, Buenos Aires",
  latitude: -34.6037,
  longitude: -58.3816,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdById: "user-1",
  updatedById: null,
  gameCount: 0,
};

function mockNominatimSuccess() {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => [{ lat: "-34.6037", lon: "-58.3816" }],
  });
}

function mockNominatimEmpty() {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => [],
  });
}

describe("PlaygroundService", () => {
  afterEach(() => jest.clearAllMocks());

  describe("list", () => {
    it("returns results sorted alphabetically by name (from model)", async () => {
      const records = [
        { ...mockPlayground, id: "pg-2", name: "Zeta Cancha" },
        { ...mockPlayground, id: "pg-1", name: "Alpha Cancha" },
      ];
      (PlaygroundModel.findAll as jest.Mock).mockResolvedValue(records);

      const result = await PlaygroundService.list();

      expect(result[0]!.name).toBe("Zeta Cancha");
    });
  });

  describe("findById", () => {
    it("returns the playground when found", async () => {
      (PlaygroundModel.findById as jest.Mock).mockResolvedValue(mockPlayground);
      const result = await PlaygroundService.findById("pg-1");
      expect(result.id).toBe("pg-1");
    });

    it("throws AppError 404 when record is not found", async () => {
      (PlaygroundModel.findById as jest.Mock).mockResolvedValue(null);
      await expect(PlaygroundService.findById("missing")).rejects.toMatchObject(
        {
          statusCode: 404,
        },
      );
    });
  });

  describe("create", () => {
    it("geocodes the address and stores the first result's lat/lng", async () => {
      mockNominatimSuccess();
      (PlaygroundModel.create as jest.Mock).mockResolvedValue(mockPlayground);

      await PlaygroundService.create(
        { name: "Cancha Norte", address: "Av. Corrientes 1234" },
        "user-1",
      );

      const createCall = (PlaygroundModel.create as jest.Mock).mock.calls[0][0];
      expect(createCall).toMatchObject({
        latitude: -34.6037,
        longitude: -58.3816,
      });
    });

    it("throws AppError 422 ADDRESS_NOT_FOUND when Nominatim returns zero results", async () => {
      mockNominatimEmpty();

      await expect(
        PlaygroundService.create({ name: "Bad", address: "Nowhere" }, "user-1"),
      ).rejects.toMatchObject({
        statusCode: 422,
        code: "ADDRESS_NOT_FOUND",
      });
    });

    it("skips geocoding when both latitude and longitude are provided", async () => {
      (PlaygroundModel.create as jest.Mock).mockResolvedValue(mockPlayground);

      await PlaygroundService.create(
        {
          name: "Cancha Sur",
          address: "Calle Falsa 123",
          latitude: -34.9,
          longitude: -57.5,
        },
        "user-1",
      );

      // fetch should NOT have been called
      expect(mockFetch).not.toHaveBeenCalled();
      const createCall = (PlaygroundModel.create as jest.Mock).mock.calls[0][0];
      expect(createCall).toMatchObject({ latitude: -34.9, longitude: -57.5 });
    });

    it("falls back to geocoding when only one coordinate is provided (invariant violated)", async () => {
      mockNominatimSuccess();
      (PlaygroundModel.create as jest.Mock).mockResolvedValue(mockPlayground);

      // Only latitude provided — must treat as absent and geocode
      await PlaygroundService.create(
        { name: "Cancha X", address: "Av. Test 1", latitude: -34.9 },
        "user-1",
      );

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("update", () => {
    it("re-geocodes when address is present in the payload", async () => {
      mockNominatimSuccess();
      (PlaygroundModel.findById as jest.Mock).mockResolvedValue(mockPlayground);
      (PlaygroundModel.update as jest.Mock).mockResolvedValue(mockPlayground);

      await PlaygroundService.update(
        "pg-1",
        { address: "New Address 99" },
        "user-2",
      );

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const updateCall = (PlaygroundModel.update as jest.Mock).mock.calls[0][1];
      expect(updateCall).toMatchObject({
        latitude: -34.6037,
        longitude: -58.3816,
      });
    });

    it("does NOT re-geocode when address is absent from the payload", async () => {
      (PlaygroundModel.findById as jest.Mock).mockResolvedValue(mockPlayground);
      (PlaygroundModel.update as jest.Mock).mockResolvedValue(mockPlayground);

      await PlaygroundService.update("pg-1", { name: "New Name" }, "user-2");

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe("delete", () => {
    it("throws AppError 409 PLAYGROUND_IN_USE when countGames returns > 0", async () => {
      (PlaygroundModel.findById as jest.Mock).mockResolvedValue(mockPlayground);
      (PlaygroundModel.countGames as jest.Mock).mockResolvedValue(2);

      await expect(PlaygroundService.delete("pg-1")).rejects.toMatchObject({
        statusCode: 409,
        code: "PLAYGROUND_IN_USE",
      });
    });

    it("deletes the playground when countGames returns 0", async () => {
      (PlaygroundModel.findById as jest.Mock).mockResolvedValue(mockPlayground);
      (PlaygroundModel.countGames as jest.Mock).mockResolvedValue(0);
      (PlaygroundModel.delete as jest.Mock).mockResolvedValue(undefined);

      await expect(PlaygroundService.delete("pg-1")).resolves.not.toThrow();
      expect(PlaygroundModel.delete).toHaveBeenCalledWith("pg-1");
    });
  });
});
