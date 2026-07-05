import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function ok<T>(data: T, meta: Record<string, unknown> = {}) {
  return NextResponse.json({ data, meta });
}

export function apiError(
  code: string,
  message: string,
  status = 400,
  details?: unknown,
) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        details,
      },
    },
    { status },
  );
}

export function validationError(error: ZodError) {
  return apiError(
    "VALIDATION_ERROR",
    "Request validation failed.",
    422,
    error.flatten(),
  );
}
