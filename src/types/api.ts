export interface ApiResponse<T> {
  success: true;
  message: string;
  data: T;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  timestamp: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}

export class ApiClientError extends Error {
  status: number;
  code?: string;
  timestamp?: string;
  fieldErrors?: Record<string, string[]>;
  data?: Record<string, unknown>;

  constructor(
    message: string,
    status: number,
    timestamp?: string,
    fieldErrors?: Record<string, string[]>,
    code?: string,
    data?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.timestamp = timestamp;
    this.fieldErrors = fieldErrors;
    this.code = code;
    this.data = data;
  }

  get errors(): Record<string, string[]> | undefined {
    return this.fieldErrors;
  }
}

