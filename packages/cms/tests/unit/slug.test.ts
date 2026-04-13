import { generateGameSlug } from "../../src/utils/slug";
import type { PrismaClient } from "@prisma/client";

function makePrisma(
  findFirst: jest.Mock = jest.fn().mockResolvedValue(null),
  findMany: jest.Mock = jest.fn().mockResolvedValue([]),
): PrismaClient {
  return {
    game: { findFirst, findMany },
  } as unknown as PrismaClient;
}

describe("generateGameSlug", () => {
  it("transliterates Spanish accented characters correctly", async () => {
    const prisma = makePrisma();
    const slug = await generateGameSlug(
      new Date("2026-04-15T00:00:00Z"),
      "Atlético Municipál",
      prisma,
    );
    expect(slug).toBe("2026-04-15-atletico-municipal");
  });

  it("collapses consecutive hyphens and trims", async () => {
    const prisma = makePrisma();
    const slug = await generateGameSlug(
      new Date("2026-04-15T00:00:00Z"),
      "FC --- Stars  &  Unidos",
      prisma,
    );
    expect(slug).toMatch(/^2026-04-15-fc-stars-unidos$/);
  });

  it("throws a validation error when the name produces an empty slug", async () => {
    const prisma = makePrisma();
    await expect(
      generateGameSlug(new Date("2026-04-15T00:00:00Z"), "---", prisma),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("appends -2 suffix when base slug already exists", async () => {
    const findFirst = jest.fn().mockResolvedValue({ id: "other-game" });
    const findMany = jest.fn().mockResolvedValue([]);
    const prisma = makePrisma(findFirst, findMany);
    const slug = await generateGameSlug(
      new Date("2026-04-15T00:00:00Z"),
      "Racing Club",
      prisma,
    );
    expect(slug).toBe("2026-04-15-racing-club-2");
  });

  it("appends -3 when both base and -2 exist", async () => {
    const findFirst = jest.fn().mockResolvedValue({ id: "other-game" });
    const findMany = jest
      .fn()
      .mockResolvedValue([{ slug: "2026-04-15-racing-club-2" }]);
    const prisma = makePrisma(findFirst, findMany);
    const slug = await generateGameSlug(
      new Date("2026-04-15T00:00:00Z"),
      "Racing Club",
      prisma,
    );
    expect(slug).toBe("2026-04-15-racing-club-3");
  });

  it("excludes existingGameId from conflict check (own slug update)", async () => {
    const ownId = "game-uuid-abc";
    // findFirst returns null because existingGameId is excluded → no conflict
    const findFirst = jest.fn().mockResolvedValue(null);
    const findMany = jest.fn().mockResolvedValue([]);
    const prisma = makePrisma(findFirst, findMany);
    const slug = await generateGameSlug(
      new Date("2026-04-15T00:00:00Z"),
      "Racing Club",
      prisma,
      ownId,
    );
    expect(slug).toBe("2026-04-15-racing-club");
    // Confirm NOT filter was applied
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ NOT: { id: ownId } }),
      }),
    );
  });
});
