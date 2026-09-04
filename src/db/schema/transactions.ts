import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  bigint,
  timestamp,
  check,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { accounts } from "./accounts";

// ---------------------------------------------------------------------------
// Transaction type enum
// ---------------------------------------------------------------------------
// Only two types exist in the assignment scope:
//   opening_balance — initial funds added during account creation
//   transfer        — ZMEX-to-ZMEX money movement
// ---------------------------------------------------------------------------
export const transactionTypeEnum = pgEnum("transaction_type", [
  "opening_balance",
  "transfer",
]);

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    type: transactionTypeEnum("type").notNull(),

    // Nullable: opening_balance has no internal ZMEX sender.
    // Transfer: must be set and differ from recipientAccountId.
    senderAccountId: uuid("sender_account_id").references(() => accounts.id, {
      onDelete: "restrict",
    }),

    recipientAccountId: uuid("recipient_account_id")
      .notNull()
      .references(() => accounts.id, {
        onDelete: "restrict",
      }),

    // Amount in integer paise. Must always be > 0 — prevents zero/negative transfers.
    amountPaise: bigint("amount_paise", { mode: "number" }).notNull(),

    // Idempotency key prevents duplicate financial requests from executing twice.
    // Unique index acts as the collision gate for concurrent requests.
    idempotencyKey: varchar("idempotency_key", { length: 128 })
      .notNull()
      .unique(),

    // SHA-256 hex fingerprint of the request payload (64 chars).
    // Allows: same key + same payload → return original result.
    //         same key + different payload → reject as conflict.
    requestFingerprint: varchar("request_fingerprint", { length: 64 }).notNull(),

    note: varchar("note", { length: 255 }),

    // Transactions are immutable after creation — no updatedAt.
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    // Amount must be strictly positive — eliminates zero and negative transfers.
    check("transactions_amount_positive", sql`${t.amountPaise} > 0`),

    // Enforce type-consistent sender/recipient rules at database level:
    //   opening_balance → sender must be NULL
    //   transfer        → sender must exist AND must differ from recipient
    check(
      "transactions_type_consistency",
      sql`(
        (${t.type} = 'opening_balance' AND ${t.senderAccountId} IS NULL)
        OR
        (${t.type} = 'transfer' AND ${t.senderAccountId} IS NOT NULL AND ${t.senderAccountId} <> ${t.recipientAccountId})
      )`,
    ),

    // Indexes for account history queries (used by the transaction-history endpoint).
    index("transactions_sender_account_idx").on(t.senderAccountId),
    index("transactions_recipient_account_idx").on(t.recipientAccountId),
    index("transactions_created_at_idx").on(t.createdAt),
  ],
);

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type TransactionType = (typeof transactionTypeEnum.enumValues)[number];
