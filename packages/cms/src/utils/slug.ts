import { PrismaClient } from "@prisma/client";
import { createError } from "../middleware/error-handler";
import { ErrorCode } from "./error-codes";

const SPANISH_CHAR_MAP: Record<string, string> = {
  á: "a",
  à: "a",
  ä: "a",
  â: "a",
  é: "e",
  è: "e",
  ë: "e",
  ê: "e",
  í: "i",
  ì: "i",
  ï: "i",
  î: "i",
  ó: "o",
  ò: "o",
  ö: "o",
  ô: "o",
  ú: "u",
  ù: "u",
  ü: "u",
  û: "u",
  ñ: "n",
  Á: "a",
  À: "a",
  Ä: "a",
  Â: "a",
  É: "e",
  È: "e",
  Ë: "e",
  Ê: "e",
  Í: "i",
  Ì: "i",
  Ï: "i",
  Î: "i",
  Ó: "o",
  Ò: "o",
  Ö: "o",
  Ô: "o",
  Ú: "u",
  Ù: "u",
  Ü: "u",
  Û: "u",
  Ñ: "n",
};

function transliterate(text: string): string {
  return text
    .split("")
    .map((ch) => SPANISH_CHAR_MAP[ch] ?? ch)
    .join("");
}

function toSlugBase(date: Date, opponentName: string): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  const normalizedName = transliterate(opponentName)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!normalizedName) {
    throw createError(
      "Cannot generate slug: opponent name produces empty result after normalization",
      400,
      ErrorCode.VALIDATION_ERROR,
    );
  }

  return `${year}-${month}-${day}-${normalizedName}`;
}

export async function generateGameSlug(
  date: Date,
  opponentName: string,
  prisma: PrismaClient,
  existingGameId?: string,
): Promise<string> {
  const base = toSlugBase(date, opponentName);

  // Check if the base slug is available (possibly for the same game on update)
  const existing = await prisma.game.findFirst({
    where: {
      slug: base,
      ...(existingGameId ? { NOT: { id: existingGameId } } : {}),
    },
    select: { id: true },
  });

  if (!existing) {
    return base;
  }

  // Find all suffixed variants and pick the next number
  const conflicts = await prisma.game.findMany({
    where: {
      slug: { startsWith: base + "-" },
      ...(existingGameId ? { NOT: { id: existingGameId } } : {}),
    },
    select: { slug: true },
  });

  const usedNumbers = new Set<number>();
  for (const { slug } of conflicts) {
    if (!slug) continue;
    const suffix = slug.slice(base.length + 1);
    const n = parseInt(suffix, 10);
    if (!isNaN(n) && n >= 2) {
      usedNumbers.add(n);
    }
  }

  let n = 2;
  while (usedNumbers.has(n)) {
    n++;
  }

  return `${base}-${n}`;
}
