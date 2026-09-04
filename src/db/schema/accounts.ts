import {
  pgTable,
  uuid,
  varchar,
  bigint,
  timestamp,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users";

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // One-to-one: a user may only have one ZMEX account.
    // UNIQUE on userId enforces this at the database level.
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id, {
        // Financial records must not be silently deleted. Restrict prevents
        // account deletion while any user record exists.
        onDelete: "restrict",
      }),

    // Account number uniqueness prevents collisions during generation (Step 3).
    accountNumber: varchar("account_number", { length: 20 }).notNull().unique(),

    // Balance stored as integer paise (₹1 = 100 paise) to eliminate
    // floating-point precision problems.
    // mode: "number" is safe here — max balance well within Number.MAX_SAFE_INTEGER.
    balancePaise: bigint("balance_paise", { mode: "number" })
      .notNull()
      .default(0),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    // Core financial safeguard: balances must never go negative.
    check(
      "accounts_balance_non_negative",
      sql`${t.balancePaise} >= 0`,
    ),
  ],
);

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------
export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
