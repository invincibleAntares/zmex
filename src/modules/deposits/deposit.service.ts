import { createHash } from "crypto";
import { AppError } from "@/shared/errors/app-error";
import { rupeesToPaise } from "@/shared/money/money";
import { findByUserId } from "@/modules/accounts/account.repository";
import {
  findByIdempotencyKey,
  executeAtomicDeposit,
} from "./deposit.repository";
import {
  MIN_DEPOSIT_PAISE,
  MAX_DEPOSIT_PAISE,
  type DepositInput,
  type PaymentMethod,
} from "./deposit.schema";
import type { DepositResult } from "./deposit.types";

// ---------------------------------------------------------------------------
// Fingerprint generator
// ---------------------------------------------------------------------------

function buildDepositFingerprint(
  accountId: string,
  amountPaise: number,
  paymentMethod: PaymentMethod,
): string {
  const canonical = `deposit:${accountId}:${amountPaise}:${paymentMethod}`;
  return createHash("sha256").update(canonical).digest("hex");
}

// ---------------------------------------------------------------------------
// executeDeposit
// ---------------------------------------------------------------------------

export async function executeDeposit(
  authenticatedUserId: string,
  clientIdempotencyKey: string,
  input: DepositInput,
): Promise<DepositResult> {
  // 1. RESOLVE USER ACCOUNT FROM AUTHENTICATED SESSION
  const account = await findByUserId(authenticatedUserId);
  if (!account) {
    throw new AppError("Account not found", 404, "ACCOUNT_NOT_FOUND");
  }

  // 2. CONVERT AMOUNT & VALIDATE RANGE
  const amountPaise = rupeesToPaise(input.amount);
  if (amountPaise < MIN_DEPOSIT_PAISE || amountPaise > MAX_DEPOSIT_PAISE) {
    throw new AppError(
      "Deposit amount must be between ₹0.01 and ₹10,00,000",
      400,
      "VALIDATION_ERROR",
    );
  }

  // 3. IDEMPOTENCY SCOPING & FINGERPRINTING
  const scopedIdempotencyKey = `deposit:${account.id}:${clientIdempotencyKey}`;
  const requestFingerprint = buildDepositFingerprint(
    account.id,
    amountPaise,
    input.paymentMethod,
  );

  // 4. FAST-PATH IDEMPOTENCY CHECK
  const existing = await findByIdempotencyKey(scopedIdempotencyKey);
  if (existing) {
    if (existing.requestFingerprint !== requestFingerprint) {
      throw new AppError(
        "Idempotency key has already been used for a different deposit",
        409,
        "IDEMPOTENCY_CONFLICT",
      );
    }
    return {
      idempotent: true,
      deposit: {
        id: existing.id,
        amountPaise: existing.amountPaise,
        paymentMethod: existing.paymentMethod as PaymentMethod,
        createdAt: existing.createdAt,
      },
    };
  }

  // 5. EXECUTE POSTGRES TRANSACTION
  const result = await executeAtomicDeposit({
    accountId: account.id,
    amountPaise,
    paymentMethod: input.paymentMethod,
    idempotencyKey: scopedIdempotencyKey,
    requestFingerprint,
  });

  if (result.kind === "existing") {
    if (result.transaction.requestFingerprint !== requestFingerprint) {
      throw new AppError(
        "Idempotency key has already been used for a different deposit",
        409,
        "IDEMPOTENCY_CONFLICT",
      );
    }
    return {
      idempotent: true,
      deposit: {
        id: result.transaction.id,
        amountPaise: result.transaction.amountPaise,
        paymentMethod: result.transaction.paymentMethod as PaymentMethod,
        createdAt: result.transaction.createdAt,
      },
    };
  }

  // 6. RETURN SUCCESSFUL DEPOSIT
  return {
    idempotent: false,
    deposit: {
      id: result.transaction.id,
      amountPaise: result.transaction.amountPaise,
      paymentMethod: result.transaction.paymentMethod as PaymentMethod,
      createdAt: result.transaction.createdAt,
    },
  };
}
