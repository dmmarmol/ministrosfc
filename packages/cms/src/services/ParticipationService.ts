import { prisma } from "../config/database";
import { GameParticipantModel } from "../models/GameParticipant";
import { PlayerModel } from "../models/Player";
import { createError } from "../middleware/error-handler";
import { ErrorCode } from "../utils/error-codes";
import type { ConfirmationStatus } from "@prisma/client";

interface ConfirmDTO {
  friends?: { name: string }[];
}

const ParticipationService = {
  async getParticipants(gameId: string) {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { id: true },
    });
    if (!game)
      throw createError("Game not found", 404, ErrorCode.GAME_NOT_FOUND);
    return GameParticipantModel.getParticipants(gameId);
  },

  async confirmParticipation(
    gameId: string,
    userId: string,
    dto: ConfirmDTO,
  ) {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { id: true, status: true, date: true },
    });
    if (!game)
      throw createError("Game not found", 404, ErrorCode.GAME_NOT_FOUND);

    // Cannot confirm for past or completed games
    if (game.status === "COMPLETED" || game.status === "CANCELLED") {
      throw createError(
        "Cannot add participants to completed or cancelled games",
        400,
        ErrorCode.VALIDATION_ERROR,
      );
    }
    if (new Date(game.date) < new Date()) {
      throw createError(
        "Cannot add participants to past games",
        400,
        ErrorCode.VALIDATION_ERROR,
      );
    }

    // Resolve the player linked to this user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { playerId: true },
    });
    const playerId = user?.playerId;
    if (!playerId)
      throw createError("Player not found", 404, ErrorCode.PLAYER_NOT_FOUND);

    const player = await PlayerModel.findById(playerId);
    if (!player)
      throw createError("Player not found", 404, ErrorCode.PLAYER_NOT_FOUND);

    // Upsert player's own participation
    const existing = await GameParticipantModel.findParticipant(
      gameId,
      playerId,
    );
    if (!existing) {
      await GameParticipantModel.createParticipant({
        gameId,
        playerId,
        confirmationStatus: "CONFIRMED",
        confirmedById: playerId,
        confirmedAt: new Date(),
      });
    } else {
      await GameParticipantModel.updateStatus(gameId, playerId, "CONFIRMED");
    }

    // Create guest players for each friend
    const guestParticipants: { name: string; id: string }[] = [];
    if (dto.friends && dto.friends.length > 0) {
      for (const _friend of dto.friends) {
        const guestName = `Amigo de ${player.name}`;
        const guestPlayer = await GameParticipantModel.createGuestPlayer(
          guestName,
          playerId,
        );
        await GameParticipantModel.createParticipant({
          gameId,
          playerId: guestPlayer.id,
          confirmationStatus: "CONFIRMED",
          confirmedById: playerId,
          confirmedAt: new Date(),
        });
        guestParticipants.push({ name: guestPlayer.name, id: guestPlayer.id });
      }
    }

    return { confirmed: true, guestPlayers: guestParticipants };
  },

  async updateParticipationStatus(
    gameId: string,
    playerId: string,
    status: ConfirmationStatus,
    _requestingPlayerId: string,
  ) {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { status: true },
    });
    if (!game)
      throw createError("Game not found", 404, ErrorCode.GAME_NOT_FOUND);
    if (game.status === "COMPLETED") {
      throw createError(
        "Cannot modify participants for completed games",
        400,
        ErrorCode.VALIDATION_ERROR,
      );
    }

    const existing = await GameParticipantModel.findParticipant(
      gameId,
      playerId,
    );
    if (!existing)
      throw createError("Participant not found", 404, ErrorCode.NOT_FOUND);

    return GameParticipantModel.updateStatus(gameId, playerId, status);
  },

  async adminModifyParticipant(
    gameId: string,
    playerId: string,
    status: ConfirmationStatus,
  ) {
    const existing = await GameParticipantModel.findParticipant(
      gameId,
      playerId,
    );
    if (!existing)
      throw createError("Participant not found", 404, ErrorCode.NOT_FOUND);
    return GameParticipantModel.updateStatus(gameId, playerId, status);
  },
};

export { ParticipationService };
