import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNIT_NOT_FOUND"
  | "RATE_LIMITED"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INTERNAL_ERROR";

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNIT_NOT_FOUND: 404,
  RATE_LIMITED: 429,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
};

export function apiError(code: ApiErrorCode, message: string, requestId = randomUUID()) {
  return NextResponse.json(
    { error: { code, message, requestId } },
    { status: STATUS_BY_CODE[code], headers: { "X-Request-Id": requestId } }
  );
}

export function apiSuccess<T extends Record<string, unknown>>(
  data: T,
  init?: { status?: number; headers?: Record<string, string> }
) {
  const requestId = randomUUID();
  return NextResponse.json(
    { ...data, requestId },
    {
      status: init?.status ?? 200,
      headers: { "X-Request-Id": requestId, ...(init?.headers ?? {}) },
    }
  );
}
