export interface APIClientOptions {
  timeout?: number;
  headers?: Record<string, string>;
}

export interface APIRequestOptions extends RequestInit {
  timeout?: number;
}

export interface APIResponse<T> {
  data: T;
  status: number;
  statusText: string;
}
