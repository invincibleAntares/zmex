import { NextResponse } from "next/server";
import { AppError } from "@/shared/errors/app-error";

// ---------------------------------------------------------------------------
// Response shapes
// ---------------------------------------------------------------------------

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorBody {
  code: string;
  message: string;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorBody;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Return a standard JSON success response.
 *
 * @example
 * return successResponse({ status: "ok" });
 * // { "success": true, "data": { "status": "ok" } }
 */
export function successResponse<T>(
  data: T,
  status: number = 200,
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

/**
 * Return a standard JSON error response.
 *
 * - `AppError` → use its statusCode, code, and message directly.
 * - Unknown error → log server-side, return 500 with a generic message.
 *   Stack traces, SQL, and secrets are never sent to the client.
 *
 * @example
 * return errorResponse(new AppError("Not found", 404, "NOT_FOUND"));
 */
export function errorResponse(
  error: unknown,
): NextResponse<ApiErrorResponse> {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      },
      { status: error.statusCode },
    );
  }

  // Unknown/unhandled error — log internally, never expose details to client.
  console.error("[ZMEX] Unhandled error:", error);

  return NextResponse.json(
    {
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Something went wrong",
      },
    },
    { status: 500 },
  );
}
