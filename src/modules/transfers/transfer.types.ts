import type { TransactionHistoryItem } from "@/modules/transactions/transaction.types";

/**
 * Return structure for the transfer service/API.
 */
export interface TransferResult {
  transfer: TransactionHistoryItem;
  idempotent: boolean;
}
