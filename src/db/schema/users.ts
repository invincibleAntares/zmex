import { pgTable, uuid, varchar, timestamp, check, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    fullName: varchar("full_name", { length: 120 }).notNull(),

    email: varchar("email", { length: 255 }).notNull(),

    phone: varchar("phone", { length: 15 }).notNull().unique(),

    // Stores bcrypt hash — never plaintext. Hashing happens in the auth service.
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    // Case-insensitive email uniqueness: USER@example.com and user@example.com
    // are the same identity. Auth service also normalises to lowercase, but
    // the DB constraint is the final source of truth.
    uniqueIndex("users_email_lower_uidx").on(sql`lower(${t.email})`),

    // Full name must be at least 2 meaningful characters after trimming whitespace.
    check(
      "users_full_name_min_length",
      sql`char_length(trim(${t.fullName})) >= 2`,
    ),

    // Phone must be 10–15 digits only. Format normalization happens in the auth service.
    check("users_phone_format", sql`${t.phone} ~ '^[0-9]{10,15}$'`),
  ],
);

// ---------------------------------------------------------------------------
// Inferred types — used by repositories and service layers.
// ---------------------------------------------------------------------------
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
