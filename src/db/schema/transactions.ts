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
// Transaction type & Payment method enums
// ---------------------------------------------------------------------------
export const transactionTypeEnum = pgEnum("transaction_type", [
  "opening_balance",
  "transfer",
  "deposit",
]);

export const depositPaymentMethodEnum = pgEnum("payment_method", [
  "upi",
  "debit_card",
  "credit_card",
]);

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    type: transactionTypeEnum("type").notNull(),

    // Nullable: opening_balance and deposit have no internal ZMEX sender.
    // Transfer: must be set and differ from recipientAccountId.
    senderAccountId: uuid("sender_account_id").references(() => accounts.id, {
      onDelete: "restrict",
    }),

    recipientAccountId: uuid("recipient_account_id")
      .notNull()
      .references(() => accounts.id, {
        onDelete: "restrict",
      }),

    // Amount in integer paise. Must always be > 0.
    amountPaise: bigint("amount_paise", { mode: "number" }).notNull(),

    // Payment method for deposit transactions. Required for deposit, NULL for others.
    paymentMethod: depositPaymentMethodEnum("payment_method"),

    // Idempotency key prevents duplicate financial requests from executing twice.
    idempotencyKey: varchar("idempotency_key", { length: 128 })
      .notNull()
      .unique(),

    // SHA-256 hex fingerprint of the request payload (64 chars).
    requestFingerprint: varchar("request_fingerprint", { length: 64 }).notNull(),

    note: varchar("note", { length: 255 }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    // Amount must be strictly positive - eliminates zero and negative transfers/deposits.
    check("transactions_amount_positive", sql`${t.amountPaise} > 0`),

    // Enforce type-consistent sender/recipient/paymentMethod rules at database level:
    //   opening_balance -> sender IS NULL AND paymentMethod IS NULL
    //   transfer        -> sender IS NOT NULL AND sender <> recipient AND paymentMethod IS NULL
    //   deposit         -> sender IS NULL AND recipient IS NOT NULL AND paymentMethod IS NOT NULL
    check(
      "transactions_type_consistency",
      sql`(
        (${t.type} = 'opening_balance' AND ${t.senderAccountId} IS NULL AND ${t.paymentMethod} IS NULL)
        OR
        (${t.type} = 'transfer' AND ${t.senderAccountId} IS NOT NULL AND ${t.senderAccountId} <> ${t.recipientAccountId} AND ${t.paymentMethod} IS NULL)
        OR
        (${t.type} = 'deposit' AND ${t.senderAccountId} IS NULL AND ${t.recipientAccountId} IS NOT NULL AND ${t.paymentMethod} IS NOT NULL)
      )`,
    ),

    // Indexes for account history queries.
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
export type DepositPaymentMethod = (typeof depositPaymentMethodEnum.enumValues)[number];
