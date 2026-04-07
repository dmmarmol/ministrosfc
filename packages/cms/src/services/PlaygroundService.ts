import { PlaygroundModel } from "../models/Playground";
import { getRedisClient } from "../config/redis";
import { createError } from "../middleware/error-handler";
import { ErrorCode } from "../utils/error-codes";
import type { PlaygroundCreatePayload, PlaygroundUpdatePayload } from "@ministrosfc/shared";

const REDIS_KEY = "playgrounds:all";
const REDIS_TTL = 300; // 5 minutes
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

async function geocode(address: string): Promise<{ latitude: number; longitude: number }> {
  const url = `${NOMINATIM_URL}?q=${encodeURIComponent(address)}&format=json`;
  const res = await fetch(url, {
    headers: { "User-Agent": "ministrosfc/1.0" },
  });
  const results = (await res.json()) as Array<{ lat: string; lon: string }>;
  if (!results.length || !results[0]) {
    throw createError("Address not found", 422, ErrorCode.ADDRESS_NOT_FOUND);
  }
  return {
    latitude: parseFloat(results[0].lat),
    longitude: parseFloat(results[0].lon),
  };
}

const PlaygroundService = {
  async list() {
    const redis = getRedisClient();
    const cached = await redis.get(REDIS_KEY);
    if (cached) return JSON.parse(cached) as Awaited<ReturnType<typeof PlaygroundModel.findAll>>;

    const playgrounds = await PlaygroundModel.findAll();
    await redis.setex(REDIS_KEY, REDIS_TTL, JSON.stringify(playgrounds));
    return playgrounds;
  },

  async findById(id: string) {
    const playground = await PlaygroundModel.findById(id);
    if (!playground) {
      throw createError("Playground not found", 404, ErrorCode.PLAYGROUND_NOT_FOUND);
    }
    return playground;
  },

  async create(payload: PlaygroundCreatePayload, userId: string) {
    const { latitude, longitude } = await geocode(payload.address);
    const playground = await PlaygroundModel.create({
      name: payload.name,
      address: payload.address,
      latitude,
      longitude,
      createdBy: { connect: { id: userId } },
      updatedBy: { connect: { id: userId } },
    });
    const redis = getRedisClient();
    await redis.del(REDIS_KEY);
    return playground;
  },

  async update(id: string, payload: PlaygroundUpdatePayload, userId: string) {
    const existing = await PlaygroundModel.findById(id);
    if (!existing) {
      throw createError("Playground not found", 404, ErrorCode.PLAYGROUND_NOT_FOUND);
    }

    const updateData: Record<string, unknown> = {
      updatedBy: { connect: { id: userId } },
    };

    if (payload.name !== undefined) updateData.name = payload.name;

    if (payload.address !== undefined) {
      const { latitude, longitude } = await geocode(payload.address);
      updateData.address = payload.address;
      updateData.latitude = latitude;
      updateData.longitude = longitude;
    }

    const playground = await PlaygroundModel.update(id, updateData);
    const redis = getRedisClient();
    await redis.del(REDIS_KEY);
    return playground;
  },

  async delete(id: string) {
    const existing = await PlaygroundModel.findById(id);
    if (!existing) {
      throw createError("Playground not found", 404, ErrorCode.PLAYGROUND_NOT_FOUND);
    }
    const gameCount = await PlaygroundModel.countGames(id);
    if (gameCount > 0) {
      throw createError(
        "Playground has associated games and cannot be deleted",
        409,
        ErrorCode.PLAYGROUND_IN_USE,
      );
    }
    await PlaygroundModel.delete(id);
  },
};

export { PlaygroundService };
