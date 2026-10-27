import { OpponentTeamModel } from "../models/OpponentTeam";
import { createError } from "../middleware/error-handler";
import { ErrorCode } from "../utils/error-codes";
import type { Prisma } from "@prisma/client";
import type {
  OpponentTeamCreatePayload,
  OpponentTeamUpdatePayload,
} from "@ministrosfc/shared";

interface SearchOptions {
  search?: string;
  page?: number;
  limit?: number;
}

function sanitizeOptionalString(value?: string): string | undefined {
  if (value == null) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

function toOpponentTeamCreateInput(
  dto: OpponentTeamCreatePayload,
): Prisma.OpponentTeamCreateInput {
  return {
    name: dto.name.trim(),
    shortName: sanitizeOptionalString(dto.shortName),
    logoUrl: sanitizeOptionalString(dto.logoUrl),
    primaryColor: sanitizeOptionalString(dto.primaryColor),
    secondaryColor: sanitizeOptionalString(dto.secondaryColor),
    city: sanitizeOptionalString(dto.city),
    country: sanitizeOptionalString(dto.country),
    notes: sanitizeOptionalString(dto.notes),
  };
}

function toOpponentTeamUpdateInput(
  dto: OpponentTeamUpdatePayload,
): Prisma.OpponentTeamUpdateInput {
  const data: Prisma.OpponentTeamUpdateInput = {};

  if (dto.name !== undefined) {
    data.name = dto.name.trim();
  }
  if (dto.shortName !== undefined) {
    data.shortName = sanitizeOptionalString(dto.shortName);
  }
  if (dto.logoUrl !== undefined) {
    data.logoUrl = sanitizeOptionalString(dto.logoUrl);
  }
  if (dto.primaryColor !== undefined) {
    data.primaryColor = sanitizeOptionalString(dto.primaryColor);
  }
  if (dto.secondaryColor !== undefined) {
    data.secondaryColor = sanitizeOptionalString(dto.secondaryColor);
  }
  if (dto.city !== undefined) {
    data.city = sanitizeOptionalString(dto.city);
  }
  if (dto.country !== undefined) {
    data.country = sanitizeOptionalString(dto.country);
  }
  if (dto.notes !== undefined) {
    data.notes = sanitizeOptionalString(dto.notes);
  }

  return data;
}

const OpponentTeamService = {
  async createTeam(dto: OpponentTeamCreatePayload) {
    return OpponentTeamModel.create(toOpponentTeamCreateInput(dto));
  },

  async getTeamById(id: string) {
    const team = await OpponentTeamModel.findById(id);
    if (!team) {
      throw createError(
        "Opponent team not found",
        404,
        ErrorCode.OPPONENT_NOT_FOUND,
      );
    }
    return team;
  },

  async searchTeams(options: SearchOptions = {}) {
    return OpponentTeamModel.findMany(options);
  },

  async updateTeam(id: string, dto: OpponentTeamUpdatePayload) {
    await OpponentTeamService.getTeamById(id);
    return OpponentTeamModel.update(id, toOpponentTeamUpdateInput(dto));
  },

  async deleteTeam(id: string) {
    await OpponentTeamService.getTeamById(id);

    const hasGames = await OpponentTeamModel.hasGames(id);
    if (hasGames) {
      throw createError(
        "Cannot delete a team that has associated games",
        409,
        ErrorCode.CONFLICT,
      );
    }

    return OpponentTeamModel.delete(id);
  },
};

export { OpponentTeamService };
