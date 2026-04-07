import { prisma } from "../config/database";
import type { Prisma } from "@prisma/client";

const PLAYGROUND_INCLUDE = {
  _count: { select: { games: true } },
} as const;

function mapGameCount<T extends { _count: { games: number } }>(
  record: T,
): Omit<T, "_count"> & { gameCount: number } {
  const { _count, ...rest } = record;
  return { ...rest, gameCount: _count.games };
}

const PlaygroundModel = {
  async findAll() {
    const records = await prisma.playground.findMany({
      orderBy: { name: "asc" },
      include: PLAYGROUND_INCLUDE,
    });
    return records.map(mapGameCount);
  },

  async findById(id: string) {
    const record = await prisma.playground.findUnique({
      where: { id },
      include: PLAYGROUND_INCLUDE,
    });
    if (!record) return null;
    return mapGameCount(record);
  },

  async create(data: Prisma.PlaygroundCreateInput) {
    const record = await prisma.playground.create({
      data,
      include: PLAYGROUND_INCLUDE,
    });
    return mapGameCount(record);
  },

  async update(id: string, data: Prisma.PlaygroundUpdateInput) {
    const record = await prisma.playground.update({
      where: { id },
      data,
      include: PLAYGROUND_INCLUDE,
    });
    return mapGameCount(record);
  },

  async delete(id: string) {
    return prisma.playground.delete({ where: { id } });
  },

  async countGames(id: string): Promise<number> {
    return prisma.game.count({ where: { playgroundId: id } });
  },
};

export { PlaygroundModel };
