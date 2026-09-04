import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { accounts, transactions, ledgerEntries } from "@/db/schema";
import { AppError } from "@/shared/errors/app-error";
import type { PaymentMethod } from "./deposit.schema";

interface DepositRepoParams {
  accountId: string;
  amountPaise: number;
  paymentMethod: PaymentMethod;
  idempotencyKey: string;
  requestFingerprint: string;
}

// ---------------------------------------------------------------------------
// findByIdempotencyKey
// ---------------------------------------------------------------------------

/**
 * Fast-path check for an existing deposit attempt using the scoped idempotency key.
 */
export async function findByIdempotencyKey(idempotencyKey: string) {
  const result = await db
    .select({
      id: transactions.id,
      type: transactions.type,
      amountPaise: transactions.amountPaise,
      paymentMethod: transactions.paymentMethod,
      createdAt: transactions.createdAt,
      requestFingerprint: transactions.requestFingerprint,
    })
    .from(transactions)
    .where(eq(transactions.idempotencyKey, idempotencyKey))
    .limit(1);

  return result[0] ?? null;
}

// ---------------------------------------------------------------------------
// executeAtomicDeposit
// ---------------------------------------------------------------------------

/**
 * Execute the complete money deposit inside a single PostgreSQL transaction.
 *
 * Steps:
 * 1. Lock user's account FOR UPDATE.
 * 2. In-transaction idempotency re-check.
 * 3. Increase account.balance_paise.
 * 4. Insert deposit transaction record.
 * 5. Insert single credit ledger entry.
 */
export async function executeAtomicDeposit(params: DepositRepoParams) {
  return db.transaction(async (tx) => {
    // 1. LOCK USER ACCOUNT FOR UPDATE
    const lockedRows = await tx.execute<{ id: string }>(
      sql`
        SELECT id 
        FROM ${accounts} 
        WHERE id = ${params.accountId} 
        FOR UPDATE
      `,
    );

    if (lockedRows.rowCount !== 1) {
      throw new AppError("Account not found", 404, "ACCOUNT_NOT_FOUND");
    }

    // 2. IN-TRANSACTION IDEMPOTENCY RE-CHECK
    const existingTx = await tx
      .select({
        id: transactions.id,
        type: transactions.type,
        amountPaise: transactions.amountPaise,
        paymentMethod: transactions.paymentMethod,
        createdAt: transactions.createdAt,
        requestFingerprint: transactions.requestFingerprint,
      })
      .from(transactions)
      .where(eq(transactions.idempotencyKey, params.idempotencyKey))
      .limit(1);

    if (existingTx[0]) {
      return { kind: "existing" as const, transaction: existingTx[0] };
    }

    // 3. CREDIT ACCOUNT BALANCE ATOMICALLY
    await tx
      .update(accounts)
      .set({
        balancePaise: sql`${accounts.balancePaise} + ${params.amountPaise}`,
      })
      .where(eq(accounts.id, params.accountId));

    // 4. INSERT DEPOSIT TRANSACTION RECORD
    const [txRecord] = await tx
      .insert(transactions)
      .values({
        type: "deposit",
        senderAccountId: null,
        recipientAccountId: params.accountId,
        amountPaise: params.amountPaise,
        paymentMethod: params.paymentMethod,
        idempotencyKey: params.idempotencyKey,
        requestFingerprint: params.requestFingerprint,
        note: null,
      })
      .returning({
        id: transactions.id,
        type: transactions.type,
        amountPaise: transactions.amountPaise,
        paymentMethod: transactions.paymentMethod,
        createdAt: transactions.createdAt,
      });

    // 5. INSERT SINGLE CREDIT LEDGER ENTRY
    const descriptionMap: Record<PaymentMethod, string> = {
      upi: "Deposit via UPI",
      debit_card: "Deposit via Debit Card",
      credit_card: "Deposit via Credit Card",
    };

    await tx.insert(ledgerEntries).values({
      transactionId: txRecord.id,
      accountId: params.accountId,
      entryType: "credit",
      amountPaise: params.amountPaise,
      description: descriptionMap[params.paymentMethod],
    });

    return { kind: "completed" as const, transaction: txRecord };
  });
}
