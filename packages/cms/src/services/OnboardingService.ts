import { prisma } from "../config/database";
import { UserModel } from "../models/User";
import { createError } from "../middleware/error-handler";
import { ErrorCode } from "../utils/error-codes";
import type { Position } from "@prisma/client";

interface OnboardingDTO {
  isPlayer: boolean;
  jerseyNumber?: number | null;
  position?: Position | null;
}

const OnboardingService = {
  async getStatus(userId: string) {
    const user = await UserModel.findById(userId);
    if (!user) throw createError("User not found", 404, ErrorCode.NOT_FOUND);

    return {
      needsOnboarding: user.onboardingCompletedAt === null,
      prefill: {
        isPlayer: true,
        jerseyNumber: null,
        position: null,
      },
    };
  },

  async complete(userId: string, dto: OnboardingDTO) {
    const user = await UserModel.findById(userId);
    if (!user) throw createError("User not found", 404, ErrorCode.NOT_FOUND);

    // Idempotent: if already completed, return current state
    if (user.onboardingCompletedAt) {
      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          playerId: user.playerId,
          onboardingCompletedAt: user.onboardingCompletedAt,
        },
        nextStep: "/profile",
      };
    }

    if (dto.isPlayer) {
      // Validate jersey uniqueness if provided
      if (dto.jerseyNumber != null) {
        const taken = await prisma.player.findFirst({
          where: {
            jerseyNumber: dto.jerseyNumber,
            status: "ACTIVE",
            playerType: "REGISTERED",
          },
        });
        if (taken) {
          throw createError(
            "Ese número de camiseta ya está en uso",
            409,
            ErrorCode.DUPLICATE_JERSEY_NUMBER,
          );
        }
      }

      // Create Player and link to User
      const player = await prisma.player.create({
        data: {
          firstName: user.firstName,
          lastName: user.lastName,
          playerType: "REGISTERED",
          status: "ACTIVE",
          position: dto.position ?? undefined,
          jerseyNumber: dto.jerseyNumber ?? undefined,
          contactInfo: { create: {} },
        },
      });

      const updated = await UserModel.update(user.id, {
        player: { connect: { id: player.id } },
        onboardingCompletedAt: new Date(),
      });

      return {
        user: {
          id: updated.id,
          email: updated.email,
          firstName: updated.firstName,
          lastName: updated.lastName,
          role: updated.role,
          playerId: player.id,
          onboardingCompletedAt: updated.onboardingCompletedAt,
        },
        nextStep: "/profile",
      };
    }

    // isPlayer = false: just mark onboarding complete, no Player
    const updated = await UserModel.update(user.id, {
      onboardingCompletedAt: new Date(),
    });

    return {
      user: {
        id: updated.id,
        email: updated.email,
        firstName: updated.firstName,
        lastName: updated.lastName,
        role: updated.role,
        playerId: null,
        onboardingCompletedAt: updated.onboardingCompletedAt,
      },
      nextStep: "/profile",
    };
  },
};

export { OnboardingService };
