import { UserModel } from "../models/User";
import { createError } from "../middleware/error-handler";
import { ErrorCode } from "../utils/error-codes";
import type { Role } from "@prisma/client";

interface CreateUserDTO {
  email: string;
  password: string;
  name: string;
  role: Role;
}

const UserService = {
  async createUser(dto: CreateUserDTO) {
    const existing = await UserModel.findByEmail(dto.email);
    if (existing)
      throw createError("Email already in use", 409, ErrorCode.CONFLICT);
    const user = await UserModel.create(dto);
    // Don't return passwordHash
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
    if (dto.name) data.name = dto.name;
    if (dto.role) data.role = dto.role;
    // Password change handled separately (requires bcrypt)
    const user = await UserModel.update(id, data);
    const { passwordHash: _, ...safeUser } = user as any;
    return safeUser;
  },

  async deleteUser(id: string) {
    await UserService.getUserById(id);
    return UserModel.delete(id);
  },
};

export { UserService };
