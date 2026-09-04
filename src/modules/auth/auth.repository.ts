import { createHash } from "crypto";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { users, accounts, transactions, ledgerEntries } from "@/db/schema";
import type { CreateUserAccountData, RegistrationResult, CurrentUser } from "./auth.types";

// ---------------------------------------------------------------------------
// PostgreSQL error detection
// ---------------------------------------------------------------------------

const PG_UNIQUE_VIOLATION = "23505";

// Unique constraint names as defined in Step 2 schema files.
// Drizzle generates names as {table}_{column}_unique for inline .unique() calls.
// Explicitly-named indexes keep their given name.
const CONSTRAINT = {
  EMAIL: "users_email_lower_uidx",       // uniqueIndex("users_email_lower_uidx")
  PHONE: "users_phone_unique",            // .unique() on phone column
  ACCOUNT_NUMBER: "accounts_account_number_unique", // .unique() on account_number
} as const;

function extractPgError(error: unknown): {
  code?: string;
  constraint?: string;
} {
  if (typeof error !== "object" || error === null) return {};
  const e = error as Record<string, unknown>;
  return {
    code: typeof e.code === "string" ? e.code : undefined,
    constraint: typeof e.constraint === "string" ? e.constraint : undefined,
  };
}

export function isAccountNumberCollision(error: unknown): boolean {
  const { code, constraint } = extractPgError(error);
  return code === PG_UNIQUE_VIOLATION && constraint === CONSTRAINT.ACCOUNT_NUMBER;
}

export function isEmailCollision(error: unknown): boolean {
  const { code, constraint } = extractPgError(error);
  return code === PG_UNIQUE_VIOLATION && constraint === CONSTRAINT.EMAIL;
}

export function isPhoneCollision(error: unknown): boolean {
  const { code, constraint } = extractPgError(error);
  return code === PG_UNIQUE_VIOLATION && constraint === CONSTRAINT.PHONE;
}

// ---------------------------------------------------------------------------
// Opening-balance idempotency helpers
// ---------------------------------------------------------------------------

function buildOpeningBalanceMeta(
  accountId: string,
  amountPaise: number,
): { idempotencyKey: string; requestFingerprint: string } {
  // Key is deterministic from accountId — opening balance can only happen once.
  const idempotencyKey = `opening:${accountId}`;

  // Fingerprint is a SHA-256 digest of the canonical opening-balance payload.
  const canonical = `opening_balance:${accountId}:${amountPaise}`;
  const requestFingerprint = createHash("sha256")
    .update(canonical)
    .digest("hex");

  return { idempotencyKey, requestFingerprint };
}

// ---------------------------------------------------------------------------
// Repository: atomic user + account creation
// ---------------------------------------------------------------------------

/**
 * Create a user, account, and (when initialDepositPaise > 0) the opening-balance
 * transaction and credit ledger entry — all inside a single PostgreSQL transaction.
 *
 * Any failure rolls back everything. The caller never ends up with a user but
 * no account, or an account with balance but no ledger trail.
 *
 * The caller is responsible for hashing passwords and generating account numbers
 * before calling here.
 */
export async function createUserWithAccount(
  data: CreateUserAccountData,
): Promise<RegistrationResult> {
  return db.transaction(async (tx) => {
    // 1. Insert user — return only safe fields.
    const [user] = await tx
      .insert(users)
      .values({
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        passwordHash: data.passwordHash,
      })
      .returning({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        phone: users.phone,
      });

    // 2. Insert account.
    const [account] = await tx
      .insert(accounts)
      .values({
        userId: user.id,
        accountNumber: data.accountNumber,
        balancePaise: data.initialDepositPaise,
      })
      .returning({
        id: accounts.id,
        accountNumber: accounts.accountNumber,
        balancePaise: accounts.balancePaise,
      });

    // 3. Opening balance records — only created when amount > 0.
    //    DB constraint requires amount_paise > 0, so a zero-amount transaction
    //    would be rejected anyway. Skip it entirely for zero deposits.
    if (data.initialDepositPaise > 0) {
      const { idempotencyKey, requestFingerprint } =
        buildOpeningBalanceMeta(account.id, data.initialDepositPaise);

      const [txRecord] = await tx
        .insert(transactions)
        .values({
          type: "opening_balance",
          senderAccountId: null,
          recipientAccountId: account.id,
          amountPaise: data.initialDepositPaise,
          idempotencyKey,
          requestFingerprint,
          note: "Opening balance",
        })
        .returning({ id: transactions.id });

      await tx.insert(ledgerEntries).values({
        transactionId: txRecord.id,
        accountId: account.id,
        entryType: "credit",
        amountPaise: data.initialDepositPaise,
        description: "Opening balance",
      });
    }

    return { user, account };
  });
}

// ---------------------------------------------------------------------------
// Repository: user lookups
// ---------------------------------------------------------------------------

/**
 * Find a user by email for authentication.
 * Returns only the fields needed for password verification.
 * The passwordHash stays within the auth module — never returned to routes.
 */
export async function findUserByEmail(email: string): Promise<{
  id: string;
  fullName: string;
  email: string;
  phone: string;
  passwordHash: string;
} | null> {
  // Query uses lower() defensively even though registration normalises to lowercase.
  const result = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      email: users.email,
      phone: users.phone,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(sql`lower(${users.email}) = ${email}`)
    .limit(1);

  return result[0] ?? null;
}

/**
 * Find a user by id for the /api/auth/me endpoint.
 * Never returns the password hash.
 */
export async function findUserById(userId: string): Promise<CurrentUser | null> {
  const result = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      email: users.email,
      phone: users.phone,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return result[0] ?? null;
}
