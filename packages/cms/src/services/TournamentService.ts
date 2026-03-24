import { TournamentModel } from "../models/Tournament";
import { createError } from "../middleware/error-handler";
import { ErrorCode } from "../utils/error-codes";

interface TournamentCreateDTO {
  name: string;
  competitionType: string;
  description?: string;
  startDate: string;
  endDate: string;
}

interface TournamentUpdateDTO extends Partial<TournamentCreateDTO> {}

interface SearchOptions {
  competitionType?: string;
  page?: number;
  limit?: number;
}

const TournamentService = {
  async createTournament(dto: TournamentCreateDTO) {
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    if (start >= end) {
      throw createError(
        "startDate must be before endDate",
        400,
        ErrorCode.VALIDATION_ERROR,
      );
    }
    return TournamentModel.create({
      name: dto.name,
      competitionType: dto.competitionType as any,
      description: dto.description,
      startDate: start,
      endDate: end,
    });
  },

  async getTournamentById(id: string) {
    const tournament = await TournamentModel.findById(id);
    if (!tournament)
      throw createError(
        "Tournament not found",
        404,
        ErrorCode.TOURNAMENT_NOT_FOUND,
      );
    return tournament;
  },

  async listTournaments(options: SearchOptions = {}) {
    return TournamentModel.findMany(options);
  },

  async updateTournament(id: string, dto: TournamentUpdateDTO) {
    await TournamentService.getTournamentById(id);
    const data: any = {};
    if (dto.name) data.name = dto.name;
    if (dto.competitionType) data.competitionType = dto.competitionType;
    if ("description" in dto) data.description = dto.description;
    if (dto.startDate) data.startDate = new Date(dto.startDate);
    if (dto.endDate) data.endDate = new Date(dto.endDate);
    return TournamentModel.update(id, data);
  },

  async deleteTournament(id: string) {
    await TournamentService.getTournamentById(id);
    const hasGames = await TournamentModel.hasGames(id);
    if (hasGames) {
      throw createError(
        "Cannot delete a tournament that has associated games",
        409,
        ErrorCode.CONFLICT,
      );
    }
    return TournamentModel.delete(id);
  },

  async getMinistrosRecord(tournamentId: string) {
    await TournamentService.getTournamentById(tournamentId);
    return TournamentModel.calculateMinistrosRecord(tournamentId);
  },
};

export { TournamentService };
