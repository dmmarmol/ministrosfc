export enum UserRole {
  ADMIN = "ADMIN",
  EDITOR = "EDITOR",
  DT = "DT",
  PLAYER = "PLAYER",
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  playerId?: string | null;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string | null;
}

export interface UserCreateDTO {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
  playerId?: string;
}

export interface UserLoginDTO {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: Omit<User, "createdAt" | "updatedAt">;
  tokens: AuthTokens;
}
