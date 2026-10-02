import { type ApprovalDecisionType } from "@prisma/client";
import { prisma } from "../config/database";
import { createError } from "../middleware/error-handler";
import { PlayerModel } from "../models/Player";
import { UserModel } from "../models/User";
import { ErrorCode } from "../utils/error-codes";
import { noOpNotificationSenderFactory } from "./NoOpNotificationSender";

const MIN_MATCH_SCORE = 0.3;
const MAX_SUGGESTIONS = 5;

function normalize(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function tokenSet(input: string): Set<string> {
  return new Set(normalize(input).split(/\s+/).filter(Boolean));
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) {
    return 0;
  }

  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) {
      intersection += 1;
    }
  }

  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function buildMatchReasons(nameScore: number): string[] {
  const reasons: string[] = [];
  if (nameScore > 0) {
    reasons.push("name_similarity");
  }
  return reasons;
}

function checkOptimisticLock(
  currentUpdatedAt: Date,
  expectedUpdatedAt?: string,
) {
  if (!expectedUpdatedAt) {
    return;
  }

  if (currentUpdatedAt.toISOString() !== expectedUpdatedAt) {
    throw createError(
      "Stale update: request was already reviewed",
      409,
      ErrorCode.CONFLICT,
    );
  }
}

async function getPendingUserOrThrow(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw createError("Pending user not found", 404, ErrorCode.NOT_FOUND);
  }

  if (user.registrationStatus !== "PENDING_APPROVAL") {
    throw createError("Request already decided", 409, ErrorCode.CONFLICT);
  }

  return user;
}

const UserApprovalService = {
  async matchOrphanPlayers(pendingUser: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  }) {
    const searchQuery =
      `${pendingUser.firstName ?? ""} ${pendingUser.lastName ?? ""}`.trim();
    const orphanResult = await PlayerModel.findOrphans({
      search: searchQuery,
      page: 1,
      limit: 50,
    });

    const userNameTokens = tokenSet(
      `${pendingUser.firstName ?? ""} ${pendingUser.lastName ?? ""}`,
    );

    return orphanResult.players
      .map((player) => {
        const playerNameTokens = tokenSet(
          `${player.firstName} ${player.lastName}`,
        );
        const nameScore = jaccard(userNameTokens, playerNameTokens);

        const matchScore = Number(nameScore.toFixed(2));

        return {
          playerId: player.id,
          firstName: player.firstName,
          lastName: player.lastName,
          status: player.status,
          matchScore,
          matchReasons: buildMatchReasons(nameScore),
        };
      })
      .filter((candidate) => candidate.matchScore >= MIN_MATCH_SCORE)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, MAX_SUGGESTIONS);
  },

  async getPendingApprovals(options: {
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const result = await UserModel.findPendingApprovals(options);

    const data = await Promise.all(
      result.users.map(async (user) => {
        const suggestions = await UserApprovalService.matchOrphanPlayers({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        });

        return {
          userId: user.id,
          firstName: user.firstName ?? "",
          lastName: user.lastName ?? "",
          email: user.email,
          submittedAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
          suggestions,
        };
      }),
    );

    return {
      data,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  },

  async listOrphanPlayers(
    userId: string,
    options: { search?: string; page?: number; limit?: number },
  ) {
    await getPendingUserOrThrow(userId);

    const result = await PlayerModel.findOrphans(options);

    return {
      data: result.players.map((player) => ({
        playerId: player.id,
        firstName: player.firstName,
        lastName: player.lastName,
        status: player.status,
      })),
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  },

  async listOrphanPlayersGlobal(options: {
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const result = await PlayerModel.findOrphans(options);

    return {
      data: result.players.map((player) => ({
        playerId: player.id,
        firstName: player.firstName,
        lastName: player.lastName,
        status: player.status,
      })),
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  },

  async approveWithoutMerge(
    userId: string,
    reviewerId: string,
    expectedUpdatedAt?: string,
  ) {
    const result = await prisma.$transaction(async (tx) => {
      const pending = await tx.user.findUnique({ where: { id: userId } });
      if (!pending) {
        throw createError("Pending user not found", 404, ErrorCode.NOT_FOUND);
      }

      if (pending.registrationStatus !== "PENDING_APPROVAL") {
        throw createError("Request already decided", 409, ErrorCode.CONFLICT);
      }

      checkOptimisticLock(pending.updatedAt, expectedUpdatedAt);

      await tx.user.update({
        where: { id: userId },
        data: { registrationStatus: "APPROVED" },
      });

      const decision = await tx.userApprovalDecision.create({
        data: {
          userId,
          reviewerId,
          decisionType: "APPROVE_NO_MERGE",
        },
      });

      return {
        userId,
        playerId: null,
        decisionType: decision.decisionType,
        approvedAt: decision.createdAt.toISOString(),
        approvedBy: reviewerId,
      };
    });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      await noOpNotificationSenderFactory
        .create({ to: user.email })
        .sendSafe("registration-approved", {
          userId,
          reviewerId,
        });
    }

    return result;
  },

  async deny(
    userId: string,
    reviewerId: string,
    reason: string,
    expectedUpdatedAt?: string,
  ) {
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      throw createError(
        "Denial reason is required",
        400,
        ErrorCode.VALIDATION_ERROR,
      );
    }

    const pending = await getPendingUserOrThrow(userId);
    checkOptimisticLock(pending.updatedAt, expectedUpdatedAt);

    await noOpNotificationSenderFactory
      .create({ to: pending.email })
      .sendSafe("registration-denied", {
        userId,
        reviewerId,
        reason: trimmedReason,
      });

    await prisma.user.delete({ where: { id: userId } });
  },

  async approveWithMerge(
    userId: string,
    mergePlayerId: string,
    reviewerId: string,
    expectedUpdatedAt?: string,
  ) {
    return prisma.$transaction(async (tx) => {
      const pending = await tx.user.findUnique({
        where: { id: userId },
      });
      if (!pending) {
        throw createError("Pending user not found", 404, ErrorCode.NOT_FOUND);
      }

      if (pending.registrationStatus !== "PENDING_APPROVAL") {
        throw createError("Request already decided", 409, ErrorCode.CONFLICT);
      }

      checkOptimisticLock(pending.updatedAt, expectedUpdatedAt);

      const player = await tx.player.findUnique({
        where: { id: mergePlayerId },
        include: { user: true },
      });
      if (!player) {
        throw createError("Merge player not found", 404, ErrorCode.NOT_FOUND);
      }
      if (player.user) {
        throw createError(
          "Merge player already linked",
          409,
          ErrorCode.CONFLICT,
        );
      }

      await tx.user.update({
        where: { id: userId },
        data: {
          registrationStatus: "APPROVED",
          playerId: mergePlayerId,
        },
      });

      const decision = await tx.userApprovalDecision.create({
        data: {
          userId,
          reviewerId,
          decisionType: "APPROVE_WITH_MERGE",
          mergePlayerId,
        },
      });

      return {
        userId,
        playerId: mergePlayerId,
        decisionType: decision.decisionType as ApprovalDecisionType,
        approvedAt: decision.createdAt.toISOString(),
        approvedBy: reviewerId,
      };
    });
  },

  async mergeApprovedUser(
    userId: string,
    mergePlayerId: string,
    actorId: string,
    expectedUpdatedAt?: string,
  ) {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw createError("User not found", 404, ErrorCode.NOT_FOUND);
      }

      if (user.registrationStatus !== "APPROVED") {
        throw createError(
          "User must be approved before merge",
          409,
          ErrorCode.CONFLICT,
        );
      }

      if (user.playerId) {
        throw createError(
          "User already linked to player",
          409,
          ErrorCode.CONFLICT,
        );
      }

      checkOptimisticLock(user.updatedAt, expectedUpdatedAt);

      const mergePlayer = await tx.player.findUnique({
        where: { id: mergePlayerId },
        include: { user: true },
      });

      if (!mergePlayer) {
        throw createError("Merge player not found", 404, ErrorCode.NOT_FOUND);
      }

      if (mergePlayer.user) {
        throw createError(
          "Merge player already linked",
          409,
          ErrorCode.CONFLICT,
        );
      }

      await tx.user.update({
        where: { id: userId },
        data: {
          playerId: mergePlayerId,
        },
      });

      const audit = await tx.userApprovalDecision.create({
        data: {
          userId,
          reviewerId: actorId,
          decisionType: "APPROVE_WITH_MERGE",
          mergePlayerId,
        },
      });

      return {
        userId,
        playerId: mergePlayerId,
        approvedBy: actorId,
        approvedAt: audit.createdAt.toISOString(),
      };
    });
  },
};

export { UserApprovalService };
