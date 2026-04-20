import { prisma } from "../../config/database";
import type { CsvImportResultDTO } from "@ministrosfc/shared";
import { parseCsv } from "./helpers";
import { CanchasCols } from "./column-maps";

/**
 * Parse canchas.csv and upsert Playground records.
 *
 * Returns a lowercased-name → Playground ID map used by importHistorial to
 * set Game.playgroundId when a game location matches a known playground.
 */
export async function importCanchas(
  buf: Buffer,
  adminUserId: string,
  result: CsvImportResultDTO,
): Promise<Map<string, string>> {
  const nameToId = new Map<string, string>();

  // Verify the user exists before attempting any Playground upserts — a stale
  // JWT (e.g. after db:reset) would otherwise produce a confusing P2003 FK error.
  const adminExists = await prisma.user.findUnique({
    where: { id: adminUserId },
    select: { id: true },
  });
  if (!adminExists) {
    throw new Error(
      `importCanchas: user "${adminUserId}" not found. ` +
        "Your session token may be stale — log in again after db:reset.",
    );
  }

  const rows = parseCsv(buf);

  for (const row of rows) {
    const name = row[CanchasCols.cancha]?.trim();
    if (!name) {
      result.playgrounds.skipped++;
      continue;
    }

    const address = row[CanchasCols.direccion]?.trim() || "";
    const latitude = row[CanchasCols.latitud]
      ? parseFloat(row[CanchasCols.latitud]!) || null
      : null;
    const longitude = row[CanchasCols.longitud]
      ? parseFloat(row[CanchasCols.longitud]!) || null
      : null;

    const existing = await prisma.playground.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
      select: { id: true },
    });

    let playgroundId: string;
    if (existing) {
      await prisma.playground.update({
        where: { id: existing.id },
        data: { address, latitude, longitude, updatedById: adminUserId },
      });
      playgroundId = existing.id;
      result.playgrounds.updated++;
    } else {
      const created = await prisma.playground.create({
        data: { name, address, latitude, longitude, createdById: adminUserId },
        select: { id: true },
      });
      playgroundId = created.id;
      result.playgrounds.created++;
    }

    nameToId.set(name.toLowerCase(), playgroundId);
  }

  return nameToId;
}
