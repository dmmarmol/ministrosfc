import { prisma } from "../config/database";
import { GameParticipantModel } from "../models/GameParticipant";
import { PlayerModel } from "../models/Player";
import { createError } from "../middleware/error-handler";
import { ErrorCode } from "../utils/error-codes";
import { type ConfirmationStatus, type Role, GameStatus } from "@prisma/client";
import type {
  SignupRequestDTO,
  RosterEntry,
  GameSignupPageDTO,
  CurrentPlayerStatus,
} from "@ministrosfc/shared";

interface ConfirmDTO {
  friends?: { name: string }[];
}

/** Build a normalized RosterEntry from a raw GameParticipant include row. */
function toRosterEntry(p: any): RosterEntry {
  const invitedByName = p.player?.invitedBy
    ? `${p.player.invitedBy.firstName} ${p.player.invitedBy.lastName}`.trim()
    : null;
  const confirmedByName = p.confirmedBy
    ? `${p.confirmedBy.firstName} ${p.confirmedBy.lastName}`.trim()
    : null;

  return {
    participantId: p.id,
    confirmationStatus: p.confirmationStatus,
    confirmedById: p.confirmedById ?? null,
    confirmedByName,
    confirmedAt: p.confirmedAt ? (p.confirmedAt as Date).toISOString() : null,
    player: {
      id: p.player?.id ?? "",
      firstName: p.player?.firstName ?? "",
      lastName: p.player?.lastName ?? null,
      jerseyNumber: p.player?.jerseyNumber ?? null,
      position: p.player?.position ?? null,
      playerType: p.player?.playerType ?? "REGISTERED",
      invitedById: p.player?.invitedById ?? null,
      invitedByName,
    },
  };
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

  async confirmParticipation(gameId: string, userId: string, dto: ConfirmDTO) {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { id: true, status: true, date: true },
    });
    if (!game)
      throw createError("Game not found", 404, ErrorCode.GAME_NOT_FOUND);

    // Cannot confirm for past or completed games
    if (
      game.status === GameStatus.COMPLETED ||
      game.status === GameStatus.CANCELLED
    ) {
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
    const guestParticipants: {
      firstName: string;
      lastName: string;
      id: string;
    }[] = [];
    if (dto.friends && dto.friends.length > 0) {
      for (const _friend of dto.friends) {
        const guestName = `Amigo de ${player.firstName} ${player.lastName}`;
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
        guestParticipants.push({
          firstName: guestPlayer.firstName,
          lastName: guestPlayer.lastName,
          id: guestPlayer.id,
        });
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
    if (game.status === GameStatus.COMPLETED) {
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

  /** T018: Return signup page DTO (authenticated view, full guest lastName) */
  async getSignupPage(
    gameId: string,
    userId: string,
    role: Role,
  ): Promise<GameSignupPageDTO> {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        opponentTeam: { select: { id: true, name: true } },
        playground: { select: { id: true, name: true, address: true } },
        participants: {
          where: { confirmationStatus: "CONFIRMED" },
          include: {
            player: {
              include: {
                invitedBy: {
                  select: { id: true, firstName: true, lastName: true },
                },
              },
            },
            confirmedBy: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
          orderBy: { confirmedAt: "asc" },
        },
      },
    });

    if (!game)
      throw createError("Game not found", 404, ErrorCode.GAME_NOT_FOUND);

    const confirmedCount = game.participants.length;
    const isFull = game.maxPlayers != null && confirmedCount >= game.maxPlayers;

    let currentPlayerId: string | null = null;
    let currentPlayerStatus: CurrentPlayerStatus;

    if (role !== "PLAYER") {
      currentPlayerStatus = "not_player_role";
    } else {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { playerId: true },
      });
      currentPlayerId = user?.playerId ?? null;

      if (!currentPlayerId) {
        currentPlayerStatus = "no_player_linked";
      } else {
        const isSignedUp = game.participants.some(
          (p) => p.playerId === currentPlayerId,
        );
        currentPlayerStatus = isSignedUp ? "signed_up" : "not_signed_up";
      }
    }

    const roster: RosterEntry[] = game.participants.map(toRosterEntry);

    return {
      game: {
        id: game.id,
        slug: game.slug,
        date: game.date.toISOString(),
        location: game.location,
        status: game.status,
        maxPlayers: game.maxPlayers,
        lineup: game.lineup,
        opponentTeam: game.opponentTeam,
        playground: game.playground ?? null,
      },
      roster,
      confirmedCount,
      isFull,
      currentPlayerStatus,
      currentPlayerId,
    };
  },

  /** T019: Trimodal signup (self / guest / proxy) */
  async signupParticipant(
    gameId: string,
    requestingUserId: string,
    dto: SignupRequestDTO,
  ): Promise<{ entry: RosterEntry; confirmedCount: number; isFull: boolean }> {
    const user = await prisma.user.findUnique({
      where: { id: requestingUserId },
      select: { playerId: true },
    });
    const requestingPlayerId = user?.playerId;
    if (!requestingPlayerId)
      throw createError(
        "No player linked to this account",
        404,
        ErrorCode.PLAYER_NOT_FOUND,
      );

    const result = await prisma.$transaction(async (tx) => {
      // (1) Verify game status
      const game = await tx.game.findUnique({
        where: { id: gameId },
        select: { id: true, status: true, maxPlayers: true },
      });
      if (!game)
        throw createError("Game not found", 404, ErrorCode.GAME_NOT_FOUND);
      if (game.status !== GameStatus.SCHEDULED)
        throw createError(
          "Game is not open for signup",
          422,
          ErrorCode.GAME_NOT_SCHEDULED,
        );

      // (2) Capacity check
      if (game.maxPlayers != null) {
        const confirmedCount = await tx.gameParticipant.count({
          where: { gameId, confirmationStatus: "CONFIRMED" },
        });
        if (confirmedCount >= game.maxPlayers)
          throw createError(
            "Game is at full capacity",
            422,
            ErrorCode.GAME_CAPACITY_EXCEEDED,
          );
      }

      let newParticipantId: string;

      if (dto.mode === "self") {
        const existing = await tx.gameParticipant.findUnique({
          where: { gameId_playerId: { gameId, playerId: requestingPlayerId } },
        });
        if (existing) {
          await tx.gameParticipant.update({
            where: { id: existing.id },
            data: {
              confirmationStatus: "CONFIRMED",
              confirmedById: requestingPlayerId,
              confirmedAt: new Date(),
            },
          });
          newParticipantId = existing.id;
        } else {
          const created = await tx.gameParticipant.create({
            data: {
              gameId,
              playerId: requestingPlayerId,
              confirmationStatus: "CONFIRMED",
              confirmedById: requestingPlayerId,
              confirmedAt: new Date(),
            },
          });
          newParticipantId = created.id;
        }
      } else if (dto.mode === "guest") {
        const guestPlayer = await tx.player.create({
          data: {
            firstName: dto.firstName,
            lastName: dto.lastName,
            playerType: "GUEST",
            status: "ACTIVE",
            invitedById: requestingPlayerId,
            position: (dto.position as any) ?? null,
          },
        });
        const created = await tx.gameParticipant.create({
          data: {
            gameId,
            playerId: guestPlayer.id,
            confirmationStatus: "CONFIRMED",
            confirmedById: requestingPlayerId,
            confirmedAt: new Date(),
          },
        });
        newParticipantId = created.id;
      } else {
        // proxy mode
        const targetPlayer = await tx.player.findUnique({
          where: { id: dto.targetPlayerId },
          select: { id: true, playerType: true, status: true },
        });
        if (
          !targetPlayer ||
          targetPlayer.playerType !== "REGISTERED" ||
          targetPlayer.status !== "ACTIVE"
        )
          throw createError(
            "Target player not found or not eligible",
            404,
            ErrorCode.PLAYER_NOT_FOUND,
          );

        const created = await tx.gameParticipant.create({
          data: {
            gameId,
            playerId: dto.targetPlayerId,
            confirmationStatus: "CONFIRMED",
            confirmedById: requestingPlayerId,
            confirmedAt: new Date(),
          },
        });
        newParticipantId = created.id;
      }

      const newParticipant = await tx.gameParticipant.findUnique({
        where: { id: newParticipantId },
        include: {
          player: {
            include: {
              invitedBy: {
                select: { id: true, firstName: true, lastName: true },
              },
            },
          },
          confirmedBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      });

      const newConfirmedCount = await tx.gameParticipant.count({
        where: { gameId, confirmationStatus: "CONFIRMED" },
      });

      return { newParticipant, newConfirmedCount, game };
    });

    const entry = toRosterEntry(result.newParticipant);
    const isFull =
      result.game.maxPlayers != null &&
      result.newConfirmedCount >= result.game.maxPlayers;

    return { entry, confirmedCount: result.newConfirmedCount, isFull };
  },

  /** T021: Remove a participant with access guards (FR-013b) */
  async removeParticipant(
    gameId: string,
    participantId: string,
    _requestingUserId: string,
    role: Role,
  ): Promise<void> {
    const participant = await prisma.gameParticipant.findFirst({
      where: { id: participantId, gameId },
    });
    if (!participant)
      throw createError("Participant not found", 404, ErrorCode.NOT_FOUND);

    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { status: true },
    });
    if (!game)
      throw createError("Game not found", 404, ErrorCode.GAME_NOT_FOUND);

    // T066: DT has same permission as EDITOR — SCHEDULED games only
    if (
      (role === "EDITOR" || role === "DT") &&
      game.status !== GameStatus.SCHEDULED
    ) {
      throw createError(
        "Editors and DT can only remove participants from scheduled games",
        403,
        ErrorCode.FORBIDDEN,
      );
    }

    await prisma.gameParticipant.delete({ where: { id: participantId } });
  },

  /** T065: Player self-unregisters from a SCHEDULED game (idempotent) */
  async selfUnregister(
    gameId: string,
    requestingUserId: string,
  ): Promise<void> {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { status: true },
    });
    if (!game)
      throw createError("Game not found", 404, ErrorCode.GAME_NOT_FOUND);
    if (game.status !== GameStatus.SCHEDULED)
      throw createError(
        "Game is not open for unregistration",
        422,
        ErrorCode.GAME_NOT_SCHEDULED,
      );

    const user = await prisma.user.findUnique({
      where: { id: requestingUserId },
      select: { playerId: true },
    });
    if (!user?.playerId)
      throw createError(
        "No player linked to this account",
        422,
        ErrorCode.PLAYER_NOT_FOUND,
      );

    await prisma.gameParticipant.deleteMany({
      where: { gameId, playerId: user.playerId },
    });
  },
};

export { ParticipationService };
