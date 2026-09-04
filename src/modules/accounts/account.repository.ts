import { eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts, users } from "@/db/schema";
import type { CurrentAccount, PublicBeneficiary } from "./account.types";

// ---------------------------------------------------------------------------
// findByUserId
// ---------------------------------------------------------------------------

/**
 * Find the account owned by the authenticated user.
 * Returns only the fields the account owner needs — never balance of others.
 * The authenticated user ID comes from a verified JWT, not from the request body.
 */
export async function findByUserId(
  userId: string,
): Promise<CurrentAccount | null> {
  const result = await db
    .select({
      id: accounts.id,
      accountNumber: accounts.accountNumber,
      balancePaise: accounts.balancePaise,
      createdAt: accounts.createdAt,
    })
    .from(accounts)
    .where(eq(accounts.userId, userId))
    .limit(1);

  return result[0] ?? null;
}

// ---------------------------------------------------------------------------
// findPublicByAccountNumber
// ---------------------------------------------------------------------------

/**
 * Find a ZMEX account by account number and return safe public beneficiary data.
 *
 * Returns only name + accountNumber — never balance, email, phone, or user ID.
 * The internal account ID is also returned for service-layer use
 * (e.g., future self-lookup detection), but the route must not forward it.
 */
export async function findPublicByAccountNumber(accountNumber: string): Promise<
  | (PublicBeneficiary & {
      /** Internal — do not expose to API clients. */
      _accountId: string;
    })
  | null
> {
  const result = await db
    .select({
      _accountId: accounts.id,
      name: users.fullName,
      accountNumber: accounts.accountNumber,
    })
    .from(accounts)
    .innerJoin(users, eq(accounts.userId, users.id))
    .where(eq(accounts.accountNumber, accountNumber))
    .limit(1);

  return result[0] ?? null;
}
