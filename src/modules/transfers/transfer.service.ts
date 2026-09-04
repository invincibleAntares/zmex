import { createHash } from "crypto";
import { AppError } from "@/shared/errors/app-error";
import { rupeesToPaise, MAX_TRANSFER_PAISE } from "@/shared/money/money";
import {
  findByUserId,
  findPublicByAccountNumber,
} from "@/modules/accounts/account.repository";
import {
  findByIdempotencyKey,
  executeAtomicTransfer,
} from "./transfer.repository";
import type { TransferInput } from "./transfer.schema";
import type { TransferResult } from "./transfer.types";
import type { TransactionHistoryItem } from "@/modules/transactions/transaction.types";

// ---------------------------------------------------------------------------
// Fingerprint generator
// ---------------------------------------------------------------------------

function buildTransferFingerprint(
  senderAccountId: string,
  recipientAccountId: string,
  amountPaise: number,
  note: string | undefined,
): string {
  // Canonical form: normalise empty/undefined note to empty string.
  const canonical = `transfer:${senderAccountId}:${recipientAccountId}:${amountPaise}:${note ?? ""}`;
  return createHash("sha256").update(canonical).digest("hex");
}

// ---------------------------------------------------------------------------
// executeTransfer
// ---------------------------------------------------------------------------

export async function executeTransfer(
  authenticatedUserId: string,
  clientIdempotencyKey: string,
  input: TransferInput,
): Promise<TransferResult> {
  // 1. RESOLVE SENDER ACCOUNT FROM AUTHENTICATED SESSION
  // The client never provides their own account ID.
  const senderAccount = await findByUserId(authenticatedUserId);
  if (!senderAccount) {
    throw new AppError("Account not found", 404, "ACCOUNT_NOT_FOUND");
  }

  // 2. RESOLVE AND VALIDATE RECIPIENT
  const recipient = await findPublicByAccountNumber(
    input.recipientAccountNumber,
  );
  if (!recipient) {
    throw new AppError("Recipient account not found", 404, "RECIPIENT_NOT_FOUND");
  }

  // 3. REJECT SELF-TRANSFER
  if (senderAccount.id === recipient._accountId) {
    throw new AppError(
      "You cannot transfer money to your own account",
      400,
      "SELF_TRANSFER_NOT_ALLOWED",
    );
  }

  // 4. AMOUNT CONVERSION & MAXIMUM LIMIT
  const amountPaise = rupeesToPaise(input.amount);
  if (amountPaise > MAX_TRANSFER_PAISE) {
    throw new AppError(
      `Transfer amount exceeds maximum limit of ₹${(MAX_TRANSFER_PAISE / 100).toLocaleString()}`,
      400,
      "VALIDATION_ERROR",
    );
  }

  // 5. IDEMPOTENCY SCOPING & FINGERPRINTING
  // Scope the client's UUID to the sender's account so users don't collide.
  const scopedIdempotencyKey = `transfer:${senderAccount.id}:${clientIdempotencyKey}`;
  const requestFingerprint = buildTransferFingerprint(
    senderAccount.id,
    recipient._accountId,
    amountPaise,
    input.note,
  );

  // 6. FAST-PATH IDEMPOTENCY CHECK
  const existing = await findByIdempotencyKey(scopedIdempotencyKey);
  if (existing) {
    if (existing.requestFingerprint !== requestFingerprint) {
      throw new AppError(
        "Idempotency key has already been used for a different transfer",
        409,
        "IDEMPOTENCY_CONFLICT",
      );
    }
    // Exact match! Return existing transaction as idempotent success.
    return {
      idempotent: true,
      transfer: {
        id: existing.id,
        type: existing.type,
        direction: "debit", // From sender's perspective, this was a debit.
        amountPaise: existing.amountPaise,
        note: existing.note,
        createdAt: existing.createdAt,
        counterparty: {
          name: recipient.name,
          accountNumber: recipient.accountNumber,
        },
      },
    };
  }

  // 7. EXECUTE POSTGRES TRANSACTION
  // (Handles locking, in-transaction idempotency recheck, and atomic debit/credit)
  const result = await executeAtomicTransfer({
    senderAccountId: senderAccount.id,
    recipientAccountId: recipient._accountId,
    amountPaise,
    idempotencyKey: scopedIdempotencyKey,
    requestFingerprint,
    note: input.note,
  });

  // Handle in-transaction idempotency conflict (rare concurrent race)
  if (result.kind === "existing") {
    if (result.transaction.requestFingerprint !== requestFingerprint) {
      throw new AppError(
        "Idempotency key has already been used for a different transfer",
        409,
        "IDEMPOTENCY_CONFLICT",
      );
    }
    return {
      idempotent: true,
      transfer: buildHistoryItem(result.transaction, recipient),
    };
  }

  // 8. RETURN SUCCESSFUL TRANSFER
  return {
    idempotent: false,
    transfer: buildHistoryItem(result.transaction, recipient),
  };
}

// ---------------------------------------------------------------------------
// Response formatter
// ---------------------------------------------------------------------------

function buildHistoryItem(
  transaction: {
    id: string;
    type: "opening_balance" | "transfer";
    amountPaise: number;
    note: string | null;
    createdAt: Date;
  },
  recipient: { name: string; accountNumber: string },
): TransactionHistoryItem {
  return {
    id: transaction.id,
    type: transaction.type,
    direction: "debit",
    amountPaise: transaction.amountPaise,
    note: transaction.note,
    createdAt: transaction.createdAt,
    counterparty: {
      name: recipient.name,
      accountNumber: recipient.accountNumber,
    },
  };
}
