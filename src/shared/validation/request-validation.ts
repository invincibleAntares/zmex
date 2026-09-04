import { type NextRequest } from "next/server";
import { type ZodSchema } from "zod";
import { AppError } from "@/shared/errors/app-error";

/**
 * Parse the request JSON body and validate it against a Zod schema.
 *
 * - Malformed JSON → AppError HTTP 400 / INVALID_JSON
 * - Schema failure → AppError HTTP 400 / VALIDATION_ERROR with field details
 * - Success        → typed parsed data
 *
 * Centralises request parsing so Route Handlers stay thin.
 */
export async function parseAndValidate<T>(
  request: NextRequest,
  schema: ZodSchema<T>,
): Promise<T> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new AppError(
      "Request body contains invalid JSON",
      400,
      "INVALID_JSON",
    );
  }

  const result = schema.safeParse(body);

  if (!result.success) {
    const details: Record<string, string[]> = {};

    for (const issue of result.error.issues) {
      const path = issue.path.map(String).join(".");
      if (path) {
        if (!details[path]) details[path] = [];
        details[path].push(issue.message);
      }
    }

    throw new AppError(
      "Invalid request data",
      400,
      "VALIDATION_ERROR",
      Object.keys(details).length > 0 ? details : undefined,
    );
  }

  return result.data;
}
