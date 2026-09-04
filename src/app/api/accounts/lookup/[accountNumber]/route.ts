import { type NextRequest } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth/session";
import { accountNumberSchema } from "@/modules/accounts/account.schema";
import { lookupBeneficiary } from "@/modules/accounts/account.service";
import { successResponse, errorResponse } from "@/shared/http/api-response";
import { AppError } from "@/shared/errors/app-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ accountNumber: string }> },
) {
  try {
    const userId = await getAuthenticatedUserId();

    const { accountNumber: rawAccountNumber } = await params;

    const parsed = accountNumberSchema.safeParse({
      accountNumber: rawAccountNumber,
    });

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
        "Invalid account number",
        400,
        "VALIDATION_ERROR",
        Object.keys(details).length > 0 ? details : undefined,
      );
    }

    const recipient = await lookupBeneficiary(parsed.data.accountNumber, userId);
    return successResponse(recipient);
  } catch (error) {
    return errorResponse(error);
  }
}
