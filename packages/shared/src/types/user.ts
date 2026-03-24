export enum Role {
  ADMIN = "ADMIN",
  EDITOR = "EDITOR",
  PLAYER = "PLAYER",
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  playerId?: string | null;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string | null;
}

export interface UserCreateDTO {
  email: string;
  password: string;
  name: string;
  role?: Role;
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
