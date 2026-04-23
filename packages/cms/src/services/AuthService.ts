import jwt from "jsonwebtoken";
import { UserModel } from "../models/User";
import { authConfig } from "../config/auth";
import { getRedisClient } from "../config/redis";
import { createError } from "../middleware/error-handler";
import { ErrorCode } from "../utils/error-codes";
import type { Role } from "@prisma/client";
import crypto from "crypto";

interface TokenPayload {
  userId: string;
  role: Role;
}

const REFRESH_TOKEN_PREFIX = "session:refresh:";
const AUTH_SERVICE_UNAVAILABLE_MESSAGE =
  "Authentication service temporarily unavailable. Please try again.";

function isRedisConnectionError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes("connection is closed") ||
    message.includes("econnrefused") ||
    message.includes("socket closed") ||
    message.includes("connect etimedout") ||
    message.includes("connection timeout")
  );
}

async function runWithRedisRetry<T>(
  operation: (redis: ReturnType<typeof getRedisClient>) => Promise<T>,
): Promise<T> {
  const redis = getRedisClient();

  const runOnce = async (): Promise<T> => {
    if (redis.status === "wait" || redis.status === "end") {
      await redis.connect();
    }
    return operation(redis);
  };

  try {
    return await runOnce();
  } catch (error) {
    if (!isRedisConnectionError(error)) {
      throw error;
    }

    try {
      return await runOnce();
    } catch (retryError) {
      if (isRedisConnectionError(retryError)) {
        throw createError(
          AUTH_SERVICE_UNAVAILABLE_MESSAGE,
          503,
          ErrorCode.INTERNAL_ERROR,
        );
      }
      throw retryError;
    }
  }
}

const AuthService = {
  generateTokens(payload: TokenPayload) {
    const accessToken = jwt.sign(payload, authConfig.jwtSecret, {
      expiresIn: authConfig.jwtExpiry,
    } as any);
    const refreshToken = crypto.randomBytes(40).toString("hex");
    return { accessToken, refreshToken };
  },

  async login(email: string, password: string) {
    const user = await UserModel.findByEmail(email);
    if (!user)
      throw createError(
        "Invalid email or password",
        401,
        ErrorCode.INVALID_CREDENTIALS,
      );

    const valid = await UserModel.verifyPassword(password, user.passwordHash);
    if (!valid)
      throw createError(
        "Invalid email or password",
        401,
        ErrorCode.INVALID_CREDENTIALS,
      );

    const { accessToken, refreshToken } = AuthService.generateTokens({
      userId: user.id,
      role: user.role,
    });

    // Store refresh token in Redis (30 days = 2592000 seconds)
    await runWithRedisRetry((redis) =>
      redis.setex(`${REFRESH_TOKEN_PREFIX}${refreshToken}`, 2592000, user.id),
    );

    // Update lastLoginAt
    await UserModel.update(user.id, { lastLoginAt: new Date() });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        playerId: user.playerId,
        onboardingCompletedAt:
          user.onboardingCompletedAt?.toISOString() ?? null,
      },
    };
  },

  async register(dto: {
    email: string;
    password: string;
    passwordConfirmation: string;
    firstName: string;
    lastName: string;
    isPlayer?: boolean;
  }) {
    const existing = await UserModel.findByEmail(dto.email);
    if (existing)
      throw createError(
        "Este correo ya está registrado",
        409,
        ErrorCode.CONFLICT,
      );

    const user = await UserModel.create({
      email: dto.email,
      password: dto.password,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: "PLAYER",
    });

    const { accessToken, refreshToken } = AuthService.generateTokens({
      userId: user.id,
      role: user.role,
    });

    await runWithRedisRetry((redis) =>
      redis.setex(`${REFRESH_TOKEN_PREFIX}${refreshToken}`, 2592000, user.id),
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        onboardingCompletedAt: user.onboardingCompletedAt ?? null,
      },
      nextStep: "/auth/onboarding",
    };
  },

  async refresh(refreshToken: string) {
    const userId = await runWithRedisRetry((redis) =>
      redis.get(`${REFRESH_TOKEN_PREFIX}${refreshToken}`),
    );
    if (!userId)
      throw createError(
        "Invalid or expired refresh token",
        401,
        ErrorCode.TOKEN_EXPIRED,
      );

    const user = await UserModel.findById(userId);
    if (!user) throw createError("User not found", 401, ErrorCode.UNAUTHORIZED);

    const { accessToken, refreshToken: newRefreshToken } =
      AuthService.generateTokens({ userId: user.id, role: user.role });

    // Rotate refresh token
    await runWithRedisRetry(async (redis) => {
      await redis.del(`${REFRESH_TOKEN_PREFIX}${refreshToken}`);
      await redis.setex(
        `${REFRESH_TOKEN_PREFIX}${newRefreshToken}`,
        2592000,
        user.id,
      );
      return "OK";
    });

    return { accessToken, refreshToken: newRefreshToken };
  },

  async logout(refreshToken: string) {
    await runWithRedisRetry((redis) =>
      redis.del(`${REFRESH_TOKEN_PREFIX}${refreshToken}`),
    );
  },

  async googleAuth(payload: {
    sub: string;
    email: string;
    given_name: string;
    family_name: string;
  }) {
    // (a) Find by googleSubjectId → sign in
    let user = await UserModel.findByGoogleSubjectId(payload.sub);
    if (user) {
      const existingBySubjectUser = user;
      await UserModel.update(existingBySubjectUser.id, {
        lastLoginAt: new Date(),
      });

      const { accessToken, refreshToken } = AuthService.generateTokens({
        userId: existingBySubjectUser.id,
        role: existingBySubjectUser.role,
      });
      await runWithRedisRetry((redis) =>
        redis.setex(
          `${REFRESH_TOKEN_PREFIX}${refreshToken}`,
          2592000,
          existingBySubjectUser.id,
        ),
      );

      const nextStep = existingBySubjectUser.onboardingCompletedAt
        ? existingBySubjectUser.role === "ADMIN" ||
          existingBySubjectUser.role === "EDITOR"
          ? "/admin/dashboard"
          : "/player/games"
        : "/auth/onboarding";

      return {
        accessToken,
        refreshToken,
        nextStep,
        user: {
          id: existingBySubjectUser.id,
          firstName: existingBySubjectUser.firstName,
          lastName: existingBySubjectUser.lastName,
          email: existingBySubjectUser.email,
          role: existingBySubjectUser.role,
          playerId: existingBySubjectUser.playerId,
          onboardingCompletedAt:
            existingBySubjectUser.onboardingCompletedAt?.toISOString() ?? null,
        },
      };
    }

    // (b) Find by email → link googleSubjectId + sign in
    user = await UserModel.findByEmail(payload.email);
    if (user) {
      const existingByEmailUser = user;
      await UserModel.update(existingByEmailUser.id, {
        googleSubjectId: payload.sub,
        lastLoginAt: new Date(),
      });

      const { accessToken, refreshToken } = AuthService.generateTokens({
        userId: existingByEmailUser.id,
        role: existingByEmailUser.role,
      });
      await runWithRedisRetry((redis) =>
        redis.setex(
          `${REFRESH_TOKEN_PREFIX}${refreshToken}`,
          2592000,
          existingByEmailUser.id,
        ),
      );

      const nextStep = existingByEmailUser.onboardingCompletedAt
        ? existingByEmailUser.role === "ADMIN" ||
          existingByEmailUser.role === "EDITOR"
          ? "/admin/dashboard"
          : "/player/games"
        : "/auth/onboarding";

      return {
        accessToken,
        refreshToken,
        nextStep,
        user: {
          id: existingByEmailUser.id,
          firstName: existingByEmailUser.firstName,
          lastName: existingByEmailUser.lastName,
          email: existingByEmailUser.email,
          role: existingByEmailUser.role,
          playerId: existingByEmailUser.playerId,
          onboardingCompletedAt:
            existingByEmailUser.onboardingCompletedAt?.toISOString() ?? null,
        },
      };
    }

    // (c) New user → create User (no Player — onboarding handles that)
    const newUser = await UserModel.create({
      email: payload.email,
      firstName: payload.given_name,
      lastName: payload.family_name,
      googleSubjectId: payload.sub,
      role: "PLAYER",
    });

    const { accessToken, refreshToken } = AuthService.generateTokens({
      userId: newUser.id,
      role: newUser.role,
    });
    await runWithRedisRetry((redis) =>
      redis.setex(
        `${REFRESH_TOKEN_PREFIX}${refreshToken}`,
        2592000,
        newUser.id,
      ),
    );

    return {
      accessToken,
      refreshToken,
      nextStep: "/auth/onboarding",
      user: {
        id: newUser.id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        role: newUser.role,
        playerId: null,
        onboardingCompletedAt: null,
      },
    };
  },
};

export { AuthService };
