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
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  },

  async register(dto: { email: string; password: string; name: string }) {
    const existing = await UserModel.findByEmail(dto.email);
    if (existing)
      throw createError("Email already in use", 409, ErrorCode.CONFLICT);

    const user = await UserModel.create({ ...dto, role: "PLAYER" });
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

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
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
};

export { AuthService };
