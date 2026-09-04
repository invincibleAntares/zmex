import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  bigint,
  timestamp,
  check,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { transactions } from "./transactions";
import { accounts } from "./accounts";

// ---------------------------------------------------------------------------
// Ledger entry type enum
// ---------------------------------------------------------------------------
export const ledgerEntryTypeEnum = pgEnum("ledger_entry_type", [
  "credit",
  "debit",
]);

export const ledgerEntries = pgTable(
  "ledger_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Links this entry to the parent transaction.
    // Restrict prevents accidental deletion of transactions that have ledger history.
    transactionId: uuid("transaction_id")
      .notNull()
      .references(() => transactions.id, {
        onDelete: "restrict",
      }),

    // The account whose balance this entry affects.
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id, {
        onDelete: "restrict",
      }),

    entryType: ledgerEntryTypeEnum("entry_type").notNull(),

    // Amount in integer paise. Must always be > 0.
    amountPaise: bigint("amount_paise", { mode: "number" }).notNull(),

    description: varchar("description", { length: 255 }),

    // Ledger entries are immutable financial records — no updatedAt.
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    // Ledger amounts must always be positive.
    check("ledger_entries_amount_positive", sql`${t.amountPaise} > 0`),

    // Prevents the same debit or credit from being recorded twice for the
    // same account under the same transaction (guards against logic bugs).
    uniqueIndex("ledger_entries_tx_account_type_uidx").on(
      t.transactionId,
      t.accountId,
      t.entryType,
    ),

    // Primary lookup: "all ledger entries for account X, newest first"
    index("ledger_entries_account_created_at_idx").on(
      t.accountId,
      t.createdAt,
    ),

    // Secondary lookup: "all entries belonging to a transaction"
    index("ledger_entries_transaction_idx").on(t.transactionId),
  ],
);

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------
export type LedgerEntry = typeof ledgerEntries.$inferSelect;
export type NewLedgerEntry = typeof ledgerEntries.$inferInsert;
export type LedgerEntryType = (typeof ledgerEntryTypeEnum.enumValues)[number];
