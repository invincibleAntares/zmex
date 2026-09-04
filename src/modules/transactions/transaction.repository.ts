import { eq, desc, count } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { ledgerEntries, transactions, accounts, users } from "@/db/schema";
import type { DepositPaymentMethod } from "@/db/schema";
import type { TransactionHistoryItem } from "./transaction.types";

// ---------------------------------------------------------------------------
// Table aliases
// ---------------------------------------------------------------------------
// The accounts and users tables appear twice in the history join:
//   once as the sender side, once as the recipient side.
// Drizzle requires explicit aliases to differentiate the two joins.
// ---------------------------------------------------------------------------

const senderAccount = alias(accounts, "sender_account");
const senderUser = alias(users, "sender_user");
const recipientAccount = alias(accounts, "recipient_account");
const recipientUser = alias(users, "recipient_user");

// ---------------------------------------------------------------------------
// Raw row shape returned from the joined history query
// ---------------------------------------------------------------------------

interface HistoryRow {
  // Ledger entry fields
  ledgerId: string;
  entryType: "credit" | "debit";
  ledgerAmountPaise: number;
  ledgerCreatedAt: Date;
  // Transaction fields
  txId: string;
  txType: "opening_balance" | "transfer" | "deposit";
  txAmountPaise: number;
  txPaymentMethod: DepositPaymentMethod | null;
  txNote: string | null;
  txCreatedAt: Date;
  // Sender side (nullable — opening_balance and deposit have no sender)
  senderAccountNumber: string | null;
  senderName: string | null;
  // Recipient side (always present)
  recipientAccountNumber: string;
  recipientName: string;
}

// ---------------------------------------------------------------------------
// findAccountHistory
// ---------------------------------------------------------------------------

/**
 * Fetch a paginated, joined ledger-entry history for a specific account.
 *
 * Single query — no N+1. Joins:
 *   ledger_entries → transactions → sender account+user → recipient account+user
 *
 * Left joins on sender side because opening_balance and deposit have no sender account.
 *
 * Ordering: created_at DESC, ledger entry id DESC (deterministic for ties).
 *
 * The caller is responsible for ensuring accountId belongs to the authenticated user.
 */
export async function findAccountHistory(
  accountId: string,
  page: number,
  limit: number,
): Promise<TransactionHistoryItem[]> {
  const offset = (page - 1) * limit;

  const rows = await db
    .select({
      ledgerId: ledgerEntries.id,
      entryType: ledgerEntries.entryType,
      ledgerAmountPaise: ledgerEntries.amountPaise,
      ledgerCreatedAt: ledgerEntries.createdAt,

      txId: transactions.id,
      txType: transactions.type,
      txAmountPaise: transactions.amountPaise,
      txPaymentMethod: transactions.paymentMethod,
      txNote: transactions.note,
      txCreatedAt: transactions.createdAt,

      senderAccountNumber: senderAccount.accountNumber,
      senderName: senderUser.fullName,

      recipientAccountNumber: recipientAccount.accountNumber,
      recipientName: recipientUser.fullName,
    })
    .from(ledgerEntries)
    .innerJoin(transactions, eq(ledgerEntries.transactionId, transactions.id))
    // Sender side — left join because opening_balance & deposit have senderAccountId = NULL.
    .leftJoin(senderAccount, eq(transactions.senderAccountId, senderAccount.id))
    .leftJoin(senderUser, eq(senderAccount.userId, senderUser.id))
    // Recipient side — always present per schema constraint.
    .innerJoin(
      recipientAccount,
      eq(transactions.recipientAccountId, recipientAccount.id),
    )
    .innerJoin(recipientUser, eq(recipientAccount.userId, recipientUser.id))
    .where(eq(ledgerEntries.accountId, accountId))
    .orderBy(desc(ledgerEntries.createdAt), desc(ledgerEntries.id))
    .limit(limit)
    .offset(offset);

  return rows.map(mapHistoryRow);
}

// ---------------------------------------------------------------------------
// countAccountHistory
// ---------------------------------------------------------------------------

/**
 * Count total ledger entries for the account — used for pagination metadata.
 * Scoped to the same accountId to ensure the count matches the history query.
 */
export async function countAccountHistory(accountId: string): Promise<number> {
  const result = await db
    .select({ total: count() })
    .from(ledgerEntries)
    .where(eq(ledgerEntries.accountId, accountId));

  return result[0]?.total ?? 0;
}

// ---------------------------------------------------------------------------
// Row mapping — counterparty resolution
// ---------------------------------------------------------------------------

/**
 * Map a joined DB row to a clean TransactionHistoryItem.
 *
 * Counterparty resolution:
 *   - opening_balance → null (no internal sender is modelled)
 *   - deposit         → null (payment gateway source, counterparty is null)
 *   - transfer debit  → the recipient (money left this account)
 *   - transfer credit → the sender (money arrived from them)
 */
function mapHistoryRow(row: HistoryRow): TransactionHistoryItem {
  let counterparty: TransactionHistoryItem["counterparty"] = null;

  if (row.txType === "transfer") {
    if (row.entryType === "debit") {
      // Money left this account — counterparty is the recipient.
      counterparty = {
        name: row.recipientName,
        accountNumber: row.recipientAccountNumber,
      };
    } else {
      // Money arrived — counterparty is the sender.
      counterparty = {
        name: row.senderName ?? "",
        accountNumber: row.senderAccountNumber ?? "",
      };
    }
  }

  return {
    id: row.txId,
    type: row.txType,
    direction: row.entryType,
    amountPaise: row.txAmountPaise,
    paymentMethod: row.txPaymentMethod ?? null,
    note: row.txNote,
    createdAt: row.ledgerCreatedAt,
    counterparty,
  };
}
