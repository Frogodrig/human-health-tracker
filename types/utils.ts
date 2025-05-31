// Type utilities for better type safety
export type NonNullableFields<T> = {
  [P in keyof T]: NonNullable<T[P]>;
};

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

export type WithOptional<T, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>;

export type Nullable<T> = T | null;

export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

export type Result<T, E = Error> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: E;
    };

// Type guard utilities
export function isNonNullable<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined;
}

export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Type assertion utilities
export function assertNonNullable<T>(
  value: T,
  message?: string
): asserts value is NonNullable<T> {
  if (value === null || value === undefined) {
    throw new Error(message || "Value must not be null or undefined");
  }
}

export function assertIsError(
  value: unknown,
  message?: string
): asserts value is Error {
  if (!isError(value)) {
    throw new Error(message || "Value must be an Error");
  }
}

export function assertIsRecord(
  value: unknown,
  message?: string
): asserts value is Record<string, unknown> {
  if (!isRecord(value)) {
    throw new Error(message || "Value must be a Record");
  }
}
