// ---------------------------------------------------------------------------
// Transaction history public types
// ---------------------------------------------------------------------------

/** Direction of a ledger entry relative to the authenticated user's account. */
export type TransactionDirection = "credit" | "debit";

/**
 * Public counterparty for a transfer — only name and account number.
 * Balance, email, phone, and internal IDs are never exposed.
 */
export interface TransactionCounterparty {
  name: string;
  accountNumber: string;
}

/**
 * A single item in the transaction history list.
 * Amount is always a positive integer in paise — direction communicates flow.
 */
export interface TransactionHistoryItem {
  id: string;
  type: "opening_balance" | "transfer";
  direction: TransactionDirection;
  amountPaise: number;
  note: string | null;
  createdAt: Date;
  /** null for opening_balance — no internal ZMEX sender is modelled. */
  counterparty: TransactionCounterparty | null;
}

/** Pagination metadata returned alongside history items. */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface TransactionHistoryResult {
  transactions: TransactionHistoryItem[];
  pagination: PaginationMeta;
}
