import { getAuthenticatedUserId } from "@/lib/auth/session";
import { getCurrentAccount } from "@/modules/accounts/account.service";
import { successResponse, errorResponse } from "@/shared/http/api-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = await getAuthenticatedUserId();
    const account = await getCurrentAccount(userId);
    return successResponse({ account });
  } catch (error) {
    return errorResponse(error);
  }
}
