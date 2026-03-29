import jwt from "jsonwebtoken";
import { UserModel } from "../models/User";
import { authConfig } from "../config/auth";
import { prisma } from "../config/database";
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
    const redis = getRedisClient();
    await redis.setex(
      `${REFRESH_TOKEN_PREFIX}${refreshToken}`,
      2592000,
      user.id,
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
      },
    };
  },

  async register(dto: {
    email: string;
    password: string;
    passwordConfirmation: string;
    firstName: string;
    lastName: string;
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

    // Auto-create Player record linked to User
    const player = await prisma.player.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        playerType: "REGISTERED",
        status: "ACTIVE",
        contactInfo: { create: {} },
      },
    });

    // Link User → Player
    await UserModel.update(user.id, { player: { connect: { id: player.id } } });

    const { accessToken, refreshToken } = AuthService.generateTokens({
      userId: user.id,
      role: user.role,
    });

    const redis = getRedisClient();
    await redis.setex(
      `${REFRESH_TOKEN_PREFIX}${refreshToken}`,
      2592000,
      user.id,
    );

    // Invalidate player search cache
    try {
      const keys = await redis.keys("players:search:*");
      if (keys.length > 0) await redis.del(...keys);
    } catch {
      // Non-critical
    }

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        playerId: player.id,
      },
    };
  },

  async refresh(refreshToken: string) {
    const redis = getRedisClient();
    const userId = await redis.get(`${REFRESH_TOKEN_PREFIX}${refreshToken}`);
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
    await redis.del(`${REFRESH_TOKEN_PREFIX}${refreshToken}`);
    await redis.setex(
      `${REFRESH_TOKEN_PREFIX}${newRefreshToken}`,
      2592000,
      user.id,
    );

    return { accessToken, refreshToken: newRefreshToken };
  },

  async logout(refreshToken: string) {
    const redis = getRedisClient();
    await redis.del(`${REFRESH_TOKEN_PREFIX}${refreshToken}`);
  },

  async googleAuth(payload: {
    sub: string;
    email: string;
    given_name: string;
    family_name: string;
  }) {
    const redis = getRedisClient();

    // (a) Find by googleSubjectId → sign in
    let user = await UserModel.findByGoogleSubjectId(payload.sub);
    if (user) {
      await UserModel.update(user.id, { lastLoginAt: new Date() });

      const { accessToken, refreshToken } = AuthService.generateTokens({
        userId: user.id,
        role: user.role,
      });
      await redis.setex(
        `${REFRESH_TOKEN_PREFIX}${refreshToken}`,
        2592000,
        user.id,
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
          playerId: user.playerId,
        },
      };
    }

    // (b) Find by email → link googleSubjectId + sign in
    user = await UserModel.findByEmail(payload.email);
    if (user) {
      await UserModel.update(user.id, {
        googleSubjectId: payload.sub,
        lastLoginAt: new Date(),
      });

      const { accessToken, refreshToken } = AuthService.generateTokens({
        userId: user.id,
        role: user.role,
      });
      await redis.setex(
        `${REFRESH_TOKEN_PREFIX}${refreshToken}`,
        2592000,
        user.id,
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
          playerId: user.playerId,
        },
      };
    }

    // (c) New user → create User + Player + Contact
    const newUser = await UserModel.create({
      email: payload.email,
      firstName: payload.given_name,
      lastName: payload.family_name,
      googleSubjectId: payload.sub,
      role: "PLAYER",
    });

    const player = await prisma.player.create({
      data: {
        firstName: payload.given_name,
        lastName: payload.family_name,
        playerType: "REGISTERED",
        status: "ACTIVE",
        contactInfo: { create: {} },
      },
    });

    await UserModel.update(newUser.id, {
      player: { connect: { id: player.id } },
    });

    const { accessToken, refreshToken } = AuthService.generateTokens({
      userId: newUser.id,
      role: newUser.role,
    });
    await redis.setex(
      `${REFRESH_TOKEN_PREFIX}${refreshToken}`,
      2592000,
      newUser.id,
    );

    // Invalidate player search cache
    try {
      const keys = await redis.keys("players:search:*");
      if (keys.length > 0) await redis.del(...keys);
    } catch {
      // Non-critical
    }

    return {
      accessToken,
      refreshToken,
      user: {
        id: newUser.id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        role: newUser.role,
        playerId: player.id,
      },
    };
  },
};

export { AuthService };
