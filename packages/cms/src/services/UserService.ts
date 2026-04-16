// --- Governance Helper Functions ---

import { UserRole } from "@ministrosfc/shared/src/types/user";

export function canPromote(
  actor: UserRole,
  target: UserRole,
  newRole: UserRole,
): boolean {
  // Admin can promote to any role including ADMIN
  if (actor === "ADMIN") return true;
  // Editor can only promote to PLAYER or DT, and cannot target ADMIN or EDITOR users
  if (actor === "EDITOR")
    return (
      ["PLAYER", "DT"].includes(newRole) &&
      target !== "ADMIN" &&
      target !== "EDITOR"
    );
  return false;
}

export function canDemote(
  actor: UserRole,
  _target: UserRole,
  _newRole: UserRole,
): boolean {
  // Admin can demote any user including other admins
  if (actor === "ADMIN") return true;
  // Editors cannot demote
  return false;
}

export function isRoleChangeAllowed(
  actor: UserRole,
  target: UserRole,
  newRole: UserRole,
): boolean {
  if (newRole === target) return false; // No-op
  return (
    canPromote(actor, target, newRole) || canDemote(actor, target, newRole)
  );
}

// Optimistic concurrency: require expectedUpdatedAt to match current updatedAt
export async function checkOptimisticConcurrency(
  entity: { updatedAt: Date },
  expectedUpdatedAt?: string,
) {
  if (
    expectedUpdatedAt &&
    entity.updatedAt.toISOString() !== expectedUpdatedAt
  ) {
    throw createError(
      "Stale update: entity was modified by another process",
      409,
      ErrorCode.CONFLICT,
    );
  }
}
import { UserModel } from "../models/User";
import { prisma } from "../config/database";
import { getRedisClient } from "../config/redis";
import { createError } from "../middleware/error-handler";
import { ErrorCode } from "../utils/error-codes";
import { logger } from "../utils/logger";
import type { Role } from "@prisma/client";

interface CreateUserDTO {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: Role;
}

const UserService = {
  async createUser(dto: CreateUserDTO) {
    const existing = await UserModel.findByEmail(dto.email);
    if (existing)
      throw createError("Email already in use", 409, ErrorCode.CONFLICT);
    const user = await UserModel.create(dto);
    const { passwordHash: _, ...safeUser } = user as any;
    return safeUser;
  },

  async getUserById(id: string) {
    const user = await UserModel.findById(id);
    if (!user) throw createError("User not found", 404, ErrorCode.NOT_FOUND);
    const { passwordHash: _, ...safeUser } = user as any;
    return safeUser;
  },

  async listUsers(
    options: { page?: number; limit?: number; role?: Role } = {},
  ) {
    return UserModel.findMany(options);
  },

  async updateUser(id: string, dto: Partial<CreateUserDTO>) {
    await UserService.getUserById(id);
    const data: any = {};
    if (dto.firstName) data.firstName = dto.firstName;
    if (dto.lastName) data.lastName = dto.lastName;
    if (dto.role) data.role = dto.role;
    const user = await UserModel.update(id, data);
    const { passwordHash: _, ...safeUser } = user as any;
    return safeUser;
  },

  async updateAdminUserProfile(
    userId: string,
    updates: { firstName?: string; lastName?: string; email?: string },
    expectedUpdatedAt?: string,
  ) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw createError("User not found", 404, ErrorCode.NOT_FOUND);
    }

    // Optimistic concurrency check
    if (
      expectedUpdatedAt &&
      user.updatedAt.toISOString() !== expectedUpdatedAt
    ) {
      throw createError(
        "Stale update: user was modified by another process",
        409,
        ErrorCode.CONFLICT,
      );
    }

    // Build update data with trimmed values
    const data: { firstName?: string; lastName?: string; email?: string } = {};
    if (updates.firstName !== undefined) {
      data.firstName = updates.firstName.trim();
    }
    if (updates.lastName !== undefined) {
      data.lastName = updates.lastName.trim();
    }
    if (updates.email !== undefined) {
      const trimmedEmail = updates.email.trim().toLowerCase();
      // Check email uniqueness
      const existing = await prisma.user.findUnique({
        where: { email: trimmedEmail },
      });
      if (existing && existing.id !== userId) {
        throw createError("Email already in use", 409, ErrorCode.CONFLICT);
      }
      data.email = trimmedEmail;
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data,
    });
    const { passwordHash: _, ...safe } = updated as any;
    return safe;
  },

  async deleteUser(id: string) {
    await UserService.getUserById(id);
    return UserModel.delete(id);
  },

  async listUsersAdmin(options: {
    page?: number;
    limit?: number;
    role?: Role;
    search?: string;
  }) {
    const page = options.page ?? 1;
    const limit = Math.min(Math.max(options.limit ?? 20, 1), 500);
    const skip = (page - 1) * limit;
    const where: any = {};
    if (options.role) where.role = options.role;
    if (options.search) {
      where.OR = [
        { email: { contains: options.search, mode: "insensitive" } },
        { firstName: { contains: options.search, mode: "insensitive" } },
        { lastName: { contains: options.search, mode: "insensitive" } },
      ];
    }
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
          lastLoginAt: true,
          player: {
            select: {
              id: true,
              status: true,
              jerseyNumber: true,
              photoUrl: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);
    return {
      data: users,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  },

  async changeRole(adminId: string, targetId: string, newRole: Role) {
    const caller = await prisma.user.findUnique({ where: { id: adminId } });
    if (!caller || caller.role !== "ADMIN") {
      throw createError("Unauthorized", 403, ErrorCode.FORBIDDEN);
    }
    const target = await prisma.user.findUnique({ where: { id: targetId } });
    if (!target) {
      throw createError("User not found", 404, ErrorCode.NOT_FOUND);
    }
    // Idempotent check: if role is already the target role, return early
    if (target.role === newRole) {
      const { passwordHash: _, ...safe } = target as any;
      return safe;
    }
    // Self-demotion check: Admin cannot demote themselves
    if (adminId === targetId && newRole !== "ADMIN") {
      throw createError("Cannot demote yourself", 403, ErrorCode.FORBIDDEN);
    }
    const updated = await prisma.user.update({
      where: { id: targetId },
      data: { role: newRole },
    });
    const { passwordHash: _, ...safe } = updated as any;
    return safe;
  },

  async updatePlayerStatus(
    targetUserId: string,
    status: "ACTIVE" | "INACTIVE",
  ) {
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: { player: true },
    });
    if (!user || !user.player) {
      throw createError(
        "User not found or no linked player",
        404,
        ErrorCode.NOT_FOUND,
      );
    }
    const updated = await prisma.player.update({
      where: { id: user.player.id },
      data: { status },
    });
    await UserService.invalidatePlayerCache();
    return updated;
  },

  async deletePlayer(targetUserId: string) {
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: { player: true },
    });
    if (!user || !user.player) {
      throw createError(
        "User not found or no linked player",
        404,
        ErrorCode.NOT_FOUND,
      );
    }
    await prisma.player.delete({ where: { id: user.player.id } });
    await prisma.user.update({
      where: { id: targetUserId },
      data: { player: { disconnect: true } },
    });
    await UserService.invalidatePlayerCache();
  },

  async invalidatePlayerCache() {
    try {
      const redis = getRedisClient();
      const keys = await redis.keys("cache:stats:players:list:*");
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (err) {
      logger.warn({ err }, "Player cache invalidation failed");
    }
  },
};

export { UserService };
