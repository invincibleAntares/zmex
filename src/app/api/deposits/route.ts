import { type NextRequest } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth/session";
import { parseAndValidate } from "@/shared/validation/request-validation";
import { successResponse, errorResponse } from "@/shared/http/api-response";
import { AppError } from "@/shared/errors/app-error";
import { depositSchema } from "@/modules/deposits/deposit.schema";
import { executeDeposit } from "@/modules/deposits/deposit.service";
import { z } from "zod";

export const runtime = "nodejs";

const uuidSchema = z.string().uuid();

export async function POST(request: NextRequest) {
  try {
    // 1. AUTHENTICATE FIRST
    const userId = await getAuthenticatedUserId();

    // 2. IDEMPOTENCY KEY HEADER
    const idempotencyKeyRaw = request.headers.get("Idempotency-Key");
    if (!idempotencyKeyRaw) {
      throw new AppError(
        "Idempotency-Key header is required",
        400,
        "IDEMPOTENCY_KEY_REQUIRED",
      );
    }

    const idempotencyKeyParsed = uuidSchema.safeParse(idempotencyKeyRaw);
    if (!idempotencyKeyParsed.success) {
      throw new AppError("Invalid Idempotency-Key format", 400, "VALIDATION_ERROR");
    }

    // 3. BODY VALIDATION
    const input = await parseAndValidate(request, depositSchema);

    // 4. EXECUTE DEPOSIT
    const result = await executeDeposit(
      userId,
      idempotencyKeyParsed.data,
      input,
    );

    // 5. RETURN SUCCESS
    return successResponse(result, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
