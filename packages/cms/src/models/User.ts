/**
 * User — an authenticated account that can access the CMS.
 *
 * Roles:
 *  - ADMIN   (level 4): full access — manages players, games, tournaments, users.
 *  - EDITOR  (level 3): can manage games and tournaments, read-only on players.
 *  - DT      (level 2): Director Técnico — can set tactics and manage guest players.
 *  - PLAYER  (level 1): can confirm own participation; views own data.
 *
 * A User may be linked to a Player via `playerId` (FK on User) — this connects
 * an account login to a squad member profile. Not all Users are Players
 * (e.g. staff/editors without a jersey).
 *
 * Passwords are hashed with bcrypt (cost 12) and never returned in API responses.
 * Google-only users have passwordHash = null.
 */
import { prisma } from "../config/database";
import bcrypt from "bcryptjs";
import type { User, Prisma, Role } from "@prisma/client";
import { RegistrationStatus } from "@ministrosfc/shared";

const UserModel = {
  async create(data: {
    email: string;
    password?: string;
    firstName: string;
    lastName: string;
    role?: Role;
    googleSubjectId?: string;
    registrationStatus?: RegistrationStatus;
  }): Promise<User> {
    const passwordHash = data.password
      ? await bcrypt.hash(data.password, 12)
      : null;
    const role = data.role ?? "PLAYER";
    const registrationStatus =
      data.registrationStatus ??
      (role === "ADMIN"
        ? RegistrationStatus.APPROVED
        : RegistrationStatus.PENDING_APPROVAL);

    return prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        role,
        googleSubjectId: data.googleSubjectId ?? null,
        registrationStatus,
      },
    });
  },

  async findPendingApprovals(
    options: {
      page?: number;
      limit?: number;
      search?: string;
    } = {},
  ) {
    const page = Math.max(options.page ?? 1, 1);
    const limit = Math.min(Math.max(options.limit ?? 20, 1), 100);
    const skip = (page - 1) * limit;
    const search = options.search?.trim();

    const where: Prisma.UserWhereInput = {
      registrationStatus: RegistrationStatus.PENDING_APPROVAL,
      ...(search
        ? {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "asc" },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  },

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  },

  async resolveDisplayNamesById(userId: string): Promise<{
    firstName: string;
    lastName: string;
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        firstName: true,
        lastName: true,
        player: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!user) {
      return { firstName: "", lastName: "" };
    }

    return {
      firstName: user.player?.firstName ?? user.firstName ?? "",
      lastName: user.player?.lastName ?? user.lastName ?? "",
    };
  },

  async resolveUserNames(user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  }): Promise<{
    firstName: string;
    lastName: string;
  }> {
    if (user.firstName && user.lastName) {
      return {
        firstName: user.firstName,
        lastName: user.lastName,
      };
    }

    return UserModel.resolveDisplayNamesById(user.id);
  },

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return prisma.user.update({ where: { id }, data });
  },

  async verifyPassword(
    password: string,
    hash: string | null,
  ): Promise<boolean> {
    if (!hash) return false;
    return bcrypt.compare(password, hash);
  },

  async findByGoogleSubjectId(googleSubjectId: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { googleSubjectId } });
  },

  async findMany(options: { page?: number; limit?: number; role?: Role } = {}) {
    const page = options.page ?? 1;
    const limit = Math.min(options.limit ?? 20, 100);
    const skip = (page - 1) * limit;
    const where: Prisma.UserWhereInput = options.role
      ? { role: options.role }
      : {};
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
        },
      }),
      prisma.user.count({ where }),
    ]);
    return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async delete(id: string): Promise<User> {
    return prisma.user.delete({ where: { id } });
  },
};

export { UserModel };
