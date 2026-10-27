// --- Admin Users Governance DTOs ---
import { PlayerStatus, PlayerType, Position } from "./player";
import { RegistrationStatus, UserRole } from "./user";

export interface AdminUserListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  registrationStatus: RegistrationStatus;
  createdAt: string;
  lastLoginAt: string | null;
  player: {
    id: string;
    status: string;
    jerseyNumber: number | null;
    photoUrl: string | null;
  } | null;
}

export interface AdminUserListResponse {
  data: AdminUserListItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AdminUserProfilePayload {
  email?: string;
  password?: string;
  expectedUpdatedAt?: string;
}

export interface AdminUserRoleChangePayload {
  role: UserRole;
}

export interface AdminUserPlayerStatusPayload {
  status: PlayerStatus;
}

export interface AdminUserDeleteResponse {
  success: boolean;
}

export interface PlayerProfileResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    hasPassword: boolean;
    hasGoogle: boolean;
    createdAt: string;
  };
  player: {
    id: string;
    firstName: string;
    lastName: string;
    nickname: string | null;
    position: Position | null;
    jerseyNumber: number | null;
    dateOfBirth: string | null;
    address: string | null;
    photoUrl: string | null;
    status: PlayerStatus;
    playerType: PlayerType;
  };
  contact: {
    phone: string | null;
    whatsapp: string | null;
    emergencyContact: string | null;
  };
  invitedGuests: Array<{
    id: string;
    firstName: string;
    lastName: string;
    game: { id: string; date: string; opponent: string | null } | null;
  }>;
}

export interface UpdatePlayerProfilePayload {
  firstName?: string;
  lastName?: string;
  nickname?: string;
  position?: Position | null;
  jerseyNumber?: number | null;
  dateOfBirth?: string | null;
  address?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  emergencyContact?: string | null;
  status?: PlayerStatus;
}

export interface ApiResponse<T> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

export interface ErrorResponse {
  code: string;
  message: string;
  statusCode: number;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface FilterParams {
  search?: string;
  status?: string;
  [key: string]: unknown;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export type QueryParams = PaginationParams & FilterParams & SortParams;

export type OptionItem = {
  id: string;
  name: string | null;
};

/**
 * Represents an item in a select dropdown.
 */
export interface SelectItem {
  value: string;
  label: string;
}
