import { AppError } from "@/shared/errors/app-error";
import { findByUserId, findPublicByAccountNumber } from "./account.repository";
import type { CurrentAccount, PublicBeneficiary } from "./account.types";

// ---------------------------------------------------------------------------
// getCurrentAccount
// ---------------------------------------------------------------------------

/**
 * Return the bank account belonging to the authenticated user.
 * Since registration guarantees one account per user, a missing account
 * indicates data inconsistency — surface as a safe 404, not a 500.
 */
export async function getCurrentAccount(
  userId: string,
): Promise<CurrentAccount> {
  const account = await findByUserId(userId);

  if (!account) {
    throw new AppError("Account not found", 404, "ACCOUNT_NOT_FOUND");
  }

  return account;
}

// ---------------------------------------------------------------------------
// lookupBeneficiary
// ---------------------------------------------------------------------------

/**
 * Resolve a ZMEX account number to a public beneficiary identity.
 *
 * Returns only: name + accountNumber.
 * Never returns: balance, email, phone, internal IDs.
 *
 * The transfer service will independently re-validate the recipient —
 * this lookup is only for the frontend "who am I sending to?" UX.
 */
export async function lookupBeneficiary(
  accountNumber: string,
): Promise<PublicBeneficiary> {
  const result = await findPublicByAccountNumber(accountNumber);

  if (!result) {
    throw new AppError("Account not found", 404, "RECIPIENT_NOT_FOUND");
  }

  // Strip the internal _accountId — only safe fields reach the caller.
  return {
    name: result.name,
    accountNumber: result.accountNumber,
  };
}
