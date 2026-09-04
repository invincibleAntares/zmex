import { type NextRequest } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth/session";
import { transactionQuerySchema } from "@/modules/transactions/transaction.schema";
import { getTransactionHistory } from "@/modules/transactions/transaction.service";
import { successResponse, errorResponse } from "@/shared/http/api-response";
import { AppError } from "@/shared/errors/app-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId();

    // Parse query parameters from the URL — values arrive as strings.
    const searchParams = request.nextUrl.searchParams;
    const rawQuery = {
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    };

    const parsed = transactionQuerySchema.safeParse(rawQuery);
    if (!parsed.success) {
      const details: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path.map(String).join(".");
        if (path) {
          if (!details[path]) details[path] = [];
          details[path].push(issue.message);
        }
      }
      throw new AppError(
        "Invalid query parameters",
        400,
        "VALIDATION_ERROR",
        Object.keys(details).length > 0 ? details : undefined,
      );
    }

    const { page, limit } = parsed.data;
    const result = await getTransactionHistory(userId, page, limit);

    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}
