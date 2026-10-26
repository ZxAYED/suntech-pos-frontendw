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
  timestamp?: string;
  fieldErrors?: Record<string, string[]>;

  constructor(
    message: string,
    status: number,
    timestamp?: string,
    fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.timestamp = timestamp;
    this.fieldErrors = fieldErrors;
  }
}
