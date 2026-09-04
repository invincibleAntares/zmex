import { type NextRequest } from "next/server";
import { parseAndValidate } from "@/shared/validation/request-validation";
import { loginSchema } from "@/modules/auth/auth.schema";
import { login } from "@/modules/auth/auth.service";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";
import { successResponse, errorResponse } from "@/shared/http/api-response";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const input = await parseAndValidate(request, loginSchema);
    const result = await login(input);
    const token = await createSessionToken(result.user.id);

    const response = successResponse(result);
    setSessionCookie(response, token);

    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
