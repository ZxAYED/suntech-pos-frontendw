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
}

export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export class ApiClientError extends Error {
  status: number;
  timestamp?: string;

  constructor(message: string, status: number, timestamp?: string) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.timestamp = timestamp;
  }
}
