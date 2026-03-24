import { OpponentTeamModel } from "../models/OpponentTeam";
import { createError } from "../middleware/error-handler";
import { ErrorCode } from "../utils/error-codes";

interface OpponentTeamCreateDTO {
  name: string;
  shortName?: string;
  logoUrl?: string;
  primaryColor?: string;
  notes?: string;
}

interface OpponentTeamUpdateDTO extends Partial<OpponentTeamCreateDTO> {}

interface SearchOptions {
  search?: string;
  page?: number;
  limit?: number;
}

const OpponentTeamService = {
  async createTeam(dto: OpponentTeamCreateDTO) {
    return OpponentTeamModel.create(dto);
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

  async updateTeam(id: string, dto: OpponentTeamUpdateDTO) {
    await OpponentTeamService.getTeamById(id);
    return OpponentTeamModel.update(id, dto);
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
