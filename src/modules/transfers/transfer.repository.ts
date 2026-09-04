import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { accounts, transactions, ledgerEntries } from "@/db/schema";
import { AppError } from "@/shared/errors/app-error";

interface TransferRepoParams {
  senderAccountId: string;
  recipientAccountId: string;
  amountPaise: number;
  idempotencyKey: string;
  requestFingerprint: string;
  note: string | undefined;
}

// ---------------------------------------------------------------------------
// findByIdempotencyKey
// ---------------------------------------------------------------------------

/**
 * Fast-path check for an existing transfer attempt using the scoped idempotency key.
 */
export async function findByIdempotencyKey(idempotencyKey: string) {
  const result = await db
    .select({
      id: transactions.id,
      type: transactions.type,
      amountPaise: transactions.amountPaise,
      note: transactions.note,
      createdAt: transactions.createdAt,
      requestFingerprint: transactions.requestFingerprint,
    })
    .from(transactions)
    .where(eq(transactions.idempotencyKey, idempotencyKey))
    .limit(1);

  return result[0] ?? null;
}

// ---------------------------------------------------------------------------
// executeAtomicTransfer
// ---------------------------------------------------------------------------

/**
 * Execute the complete money transfer inside a single PostgreSQL transaction.
 *
 * Provides:
 * 1. Deterministic row locking to prevent deadlocks on concurrent reverse transfers.
 * 2. In-transaction idempotency re-check.
 * 3. Atomic balance re-check and guarded debit.
 * 4. Exact-balance transfer support.
 * 5. Full rollback on any failure.
 */
export async function executeAtomicTransfer(params: TransferRepoParams) {
  return db.transaction(async (tx) => {
    // 1. DYNAMIC DETERMINISTIC LOCKING
    // Sort account UUIDs so A->B and B->A always lock in the same order.
    // This physically prevents PostgreSQL lock-order deadlocks.
    const lockIds = [params.senderAccountId, params.recipientAccountId].sort();

    // Use parameterized raw SQL for FOR UPDATE since it's the safest way
    // across varying Drizzle versions to ensure rows are locked exactly here.
    const lockedRows = await tx.execute<{ id: string }>(
      sql`
        SELECT id 
        FROM ${accounts} 
        WHERE id IN (${lockIds[0]}, ${lockIds[1]}) 
        ORDER BY id 
        FOR UPDATE
      `,
    );

    if (lockedRows.rowCount !== 2) {
      // Very rare unless an account was hard-deleted mid-flight.
      throw new AppError(
        "One or both accounts could not be verified during transfer",
        400,
        "ACCOUNT_NOT_FOUND",
      );
    }

    // 2. IN-TRANSACTION IDEMPOTENCY RE-CHECK
    // We are now inside the locked window. If another request just completed
    // this exact transfer, we will see it now.
    const existingTx = await tx
      .select({
        id: transactions.id,
        type: transactions.type,
        amountPaise: transactions.amountPaise,
        note: transactions.note,
        createdAt: transactions.createdAt,
        requestFingerprint: transactions.requestFingerprint,
      })
      .from(transactions)
      .where(eq(transactions.idempotencyKey, params.idempotencyKey))
      .limit(1);

    if (existingTx[0]) {
      // It exists! Let the service layer decide if it's a conflict or success based on fingerprint.
      return { kind: "existing" as const, transaction: existingTx[0] };
    }

    // 3. RE-CHECK BALANCE UNDER LOCK & GUARDED DEBIT
    // Use an atomic update with a WHERE clause for extra safety.
    const senderUpdate = await tx
      .update(accounts)
      .set({
        balancePaise: sql`${accounts.balancePaise} - ${params.amountPaise}`,
      })
      .where(
        sql`${accounts.id} = ${params.senderAccountId} AND ${accounts.balancePaise} >= ${params.amountPaise}`,
      )
      .returning({ id: accounts.id });

    if (senderUpdate.length === 0) {
      // Update failed — meaning balance < amountPaise.
      // Drizzle throws inside tx(), triggering a complete automatic ROLLBACK.
      throw new AppError("Insufficient balance", 400, "INSUFFICIENT_BALANCE");
    }

    // 4. CREDIT RECIPIENT
    await tx
      .update(accounts)
      .set({
        balancePaise: sql`${accounts.balancePaise} + ${params.amountPaise}`,
      })
      .where(eq(accounts.id, params.recipientAccountId));

    // 5. INSERT TRANSACTION RECORD
    const [txRecord] = await tx
      .insert(transactions)
      .values({
        type: "transfer",
        senderAccountId: params.senderAccountId,
        recipientAccountId: params.recipientAccountId,
        amountPaise: params.amountPaise,
        idempotencyKey: params.idempotencyKey,
        requestFingerprint: params.requestFingerprint,
        note: params.note ?? null,
      })
      .returning({
        id: transactions.id,
        type: transactions.type,
        amountPaise: transactions.amountPaise,
        note: transactions.note,
        createdAt: transactions.createdAt,
      });

    // 6. INSERT LEDGER ENTRIES
    // Insert both in one statement for efficiency.
    await tx.insert(ledgerEntries).values([
      {
        transactionId: txRecord.id,
        accountId: params.senderAccountId,
        entryType: "debit",
        amountPaise: params.amountPaise,
        description: "Transfer out", // A real app might format "Transfer to <acc>"
      },
      {
        transactionId: txRecord.id,
        accountId: params.recipientAccountId,
        entryType: "credit",
        amountPaise: params.amountPaise,
        description: "Transfer in",
      },
    ]);

    return { kind: "completed" as const, transaction: txRecord };
  });
}
