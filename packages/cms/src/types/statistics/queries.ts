import { z } from "zod";
import { OPTION_FILTER_ALL } from "@ministrosfc/shared";
import { PlayerStatus } from "@prisma/client";

/**
 * Filter schema for top scorers endpoint.
 */
export const topScorersQuerySchema = z.object({
  tournamentId: z.uuid().optional(),
  tournamentName: z.string().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: z.preprocess(
    (value) => (value === "" ? OPTION_FILTER_ALL : value),
    z
      .union([
        z.enum([PlayerStatus.ACTIVE, PlayerStatus.INACTIVE]),
        z.literal(OPTION_FILTER_ALL),
      ])
      .optional(),
  ),
  year: z.coerce.number().int().min(1900).max(2100).optional(),
});

export type TopScorersQuery = z.infer<typeof topScorersQuerySchema>;

/**
 * Filter schema for all players stats aggregation.
 */
export const playersStatsQuerySchema = z.object({
  year: z.coerce.number().int().min(1900).max(2100).optional(),
  rivalId: z.string().optional(),
  tournamentName: z.string().max(100).optional(),
  playerId: z.string().optional(),
  status: z.preprocess(
    (value) => (value === "" ? OPTION_FILTER_ALL : value),
    z
      .union([
        z.enum([PlayerStatus.ACTIVE, PlayerStatus.INACTIVE]),
        z.literal(OPTION_FILTER_ALL),
      ])
      .optional(),
  ),
});

export type PlayersStatsQuery = z.infer<typeof playersStatsQuerySchema>;

/**
 * Filter schema for team stats endpoints.
 */
export const teamStatsQuerySchema = z.object({
  year: z.coerce.number().int().min(1900).max(2100).optional(),
  tournamentId: z.uuid().optional(),
  tournamentName: z.string().max(100).optional(),
  rivalId: z.uuid().optional(),
  playgroundId: z.uuid().optional(),
});

export type TeamStatsQuery = z.infer<typeof teamStatsQuerySchema>;

/**
 * Internal filter shape for team stats by year.
 */
export interface TeamStatsFiltersByYear {
  tournamentId?: string;
  rivalId?: string;
}

/**
 * Internal filter shape for team stats by tournament.
 */
export interface TeamStatsFiltersByTournament {
  year?: number;
  rivalId?: string;
  tournamentName?: string;
  playgroundId?: string;
}

/**
 * Internal filter shape for team stats by rival.
 */
export interface TeamStatsFiltersByRival {
  year?: number;
  tournamentId?: string;
  tournamentName?: string;
  rivalId?: string;
  playgroundId?: string;
}

/**
 * Internal filter shape for rival breakdown.
 */
export interface RivalBreakdownFilters {
  year?: number;
  playgroundId?: string;
}

/**
 * Internal filter shape for aggregating all players.
 */
export interface AggregatePlayersAllFilters {
  year?: number;
  rivalId?: string;
  tournamentName?: string;
  playerId?: string;
  status?: PlayerStatus;
}
