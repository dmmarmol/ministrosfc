/**
 * GameParticipant — links a Player to a Game, tracking participation and per-match stats.
 *
 * REGISTERED players confirm (or decline) before the game.
 * GUEST players are created on the fly and linked here at the time of confirmation.
 *
 * Per-match stats stored here: `goalsScored`, `assists`, `yellowCards`, `redCards`,
 * `minutesPlayed`. These are later aggregated by StatisticsModel.
 *
 * `confirmedById` records which user (ADMIN/EDITOR) registered the participation.
 */
import { prisma } from "../config/database";
import type { ConfirmationStatus } from "@prisma/client";

const GameParticipantModel = {
  async getParticipants(gameId: string) {
    return prisma.gameParticipant.findMany({
      where: { gameId },
      include: {
        player: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            nickname: true,
            jerseyNumber: true,
            position: true,
            photoUrl: true,
            playerType: true,
            invitedById: true,
            invitedBy: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
        confirmedBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "asc" },
    });
  },

  async findParticipant(gameId: string, playerId: string) {
    return prisma.gameParticipant.findUnique({
      where: { gameId_playerId: { gameId, playerId } },
    });
  },

  async createParticipant(data: {
    gameId: string;
    playerId: string;
    confirmationStatus?: ConfirmationStatus;
    confirmedById?: string;
    confirmedAt?: Date;
  }) {
    return prisma.gameParticipant.create({ data });
  },

  async updateStatus(
    gameId: string,
    playerId: string,
    status: ConfirmationStatus,
  ) {
    return prisma.gameParticipant.update({
      where: { gameId_playerId: { gameId, playerId } },
      data: {
        confirmationStatus: status,
        confirmedAt: status === "CONFIRMED" ? new Date() : null,
      },
    });
  },

  async delete(gameId: string, playerId: string) {
    return prisma.gameParticipant.delete({
      where: { gameId_playerId: { gameId, playerId } },
    });
  },

  async createGuestPlayer(name: string, invitedById: string) {
    // Split the display name — guest names are "Amigo de FirstName LastName"
    const firstName = name;
    const lastName = "";
    return prisma.player.create({
      data: {
        firstName,
        lastName,
        playerType: "GUEST",
        status: "ACTIVE",
        invitedById,
      },
    });
  },
};

export { GameParticipantModel };
