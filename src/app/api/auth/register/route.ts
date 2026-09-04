import { type NextRequest } from "next/server";
import { parseAndValidate } from "@/shared/validation/request-validation";
import { registerSchema } from "@/modules/auth/auth.schema";
import { register } from "@/modules/auth/auth.service";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";
import { successResponse, errorResponse } from "@/shared/http/api-response";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const input = await parseAndValidate(request, registerSchema);
    const result = await register(input);
    const token = await createSessionToken(result.user.id);

    const response = successResponse(result, 201);
    setSessionCookie(response, token);

    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
