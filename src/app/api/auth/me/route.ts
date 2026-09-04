import { getAuthenticatedUserId } from "@/lib/auth/session";
import { getCurrentUser } from "@/modules/auth/auth.service";
import { successResponse, errorResponse } from "@/shared/http/api-response";

export const runtime = "nodejs";

// Prevent Next.js from caching this route — response depends on auth cookie.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = await getAuthenticatedUserId();
    const user = await getCurrentUser(userId);
    return successResponse({ user });
  } catch (error) {
    return errorResponse(error);
  }
}
