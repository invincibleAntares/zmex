import { clearSessionCookie } from "@/lib/auth/session";
import { successResponse } from "@/shared/http/api-response";

export const runtime = "nodejs";

export async function POST() {
  // Stateless session: clearing the HttpOnly cookie is sufficient for logout.
  // No database query needed — ZMEX does not maintain a server-side token store.
  const response = successResponse({ message: "Logged out successfully" });
  clearSessionCookie(response);
  return response;
}
