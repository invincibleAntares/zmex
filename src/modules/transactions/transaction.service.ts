import { AppError } from "@/shared/errors/app-error";
import { findByUserId } from "@/modules/accounts/account.repository";
import {
  findAccountHistory,
  countAccountHistory,
} from "./transaction.repository";
import type {
  TransactionHistoryResult,
  PaginationMeta,
} from "./transaction.types";

// ---------------------------------------------------------------------------
// getTransactionHistory
// ---------------------------------------------------------------------------

/**
 * Return paginated transaction history for the authenticated user.
 *
 * The account is resolved from the authenticated userId — the client
 * cannot supply an arbitrary accountId to view someone else's history.
 */
export async function getTransactionHistory(
  userId: string,
  page: number,
  limit: number,
): Promise<TransactionHistoryResult> {
  // Resolve the authenticated user's account.
  const account = await findByUserId(userId);
  if (!account) {
    throw new AppError("Account not found", 404, "ACCOUNT_NOT_FOUND");
  }

  // Fetch history and total count in parallel — two queries, no N+1.
  const [items, total] = await Promise.all([
    findAccountHistory(account.id, page, limit),
    countAccountHistory(account.id),
  ]);

  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

  const pagination: PaginationMeta = {
    page,
    limit,
    total,
    totalPages,
    hasMore: page < totalPages,
  };

  return { transactions: items, pagination };
}
