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
