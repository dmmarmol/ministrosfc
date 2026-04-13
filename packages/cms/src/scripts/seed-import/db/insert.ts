import { PrismaClient } from "@prisma/client";
import type { buildOpponentTeams } from "../transformers/opponentTeams";
import type { buildTournaments } from "../transformers/tournaments";
import type { buildPlayers } from "../transformers/players";
import type { buildGames } from "../transformers/games";
import type { buildGameParticipants } from "../transformers/gameParticipants";

type OpponentTeamData = ReturnType<typeof buildOpponentTeams>["data"][0];
type TournamentData = ReturnType<typeof buildTournaments>["data"][0];
type PlayerData = ReturnType<typeof buildPlayers>["players"][0];
type ContactData = ReturnType<typeof buildPlayers>["contacts"][0];
type GameData = ReturnType<typeof buildGames>["data"][0];
type GameParticipantData = ReturnType<typeof buildGameParticipants>["data"][0];

export interface InsertPayload {
  opponentTeams: OpponentTeamData[];
  tournaments: TournamentData[];
  players: PlayerData[];
  contacts: ContactData[];
  games: GameData[];
  gameParticipants: GameParticipantData[];
}

/**
 * Insert all entities in FK dependency order using chunked createMany calls.
 * Chunks at 500 rows to stay under PostgreSQL's ~65k bind-parameter limit.
 * Must be called inside a Prisma interactive transaction.
 */
export async function insertAll(
  tx: Omit<
    PrismaClient,
    "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
  >,
  payload: InsertPayload,
): Promise<void> {
  // 1. OpponentTeams (no FK deps)
  for (const batch of chunk(payload.opponentTeams, 500)) {
    await tx.opponentTeam.createMany({ data: batch });
  }

  // 2. Tournaments (no FK deps)
  for (const batch of chunk(payload.tournaments, 500)) {
    await tx.tournament.createMany({
      data: batch.map((t) => ({
        id: t.id,
        name: t.name,
        competitionType: t.competitionType,
        startDate: t.startDate,
        endDate: t.endDate,
      })),
    });
  }

  // 3. Players (FK: invitedById is null for all imports)
  for (const batch of chunk(payload.players, 500)) {
    await tx.player.createMany({ data: batch });
  }

  // 4. Contacts (FK: playerId → Player)
  for (const batch of chunk(payload.contacts, 500)) {
    await tx.contact.createMany({ data: batch });
  }

  // 5. Games (FK: opponentTeamId, tournamentId)
  for (const batch of chunk(payload.games, 500)) {
    await tx.game.createMany({
      data: batch.map((g) => ({
        ...g,
        // Required since lineup/endDate migration: seed import creates stable fallback values.
        slug: `import-${g.id}`,
        endDate: new Date(g.date.getTime() + 100 * 60 * 1000),
      })),
    });
  }

  // 6. GameParticipants (FK: gameId, playerId)
  for (const batch of chunk(payload.gameParticipants, 500)) {
    await tx.gameParticipant.createMany({ data: batch });
  }
}

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}
