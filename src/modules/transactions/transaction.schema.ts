import { z } from "zod";

// ---------------------------------------------------------------------------
// Transaction history query parameters
// ---------------------------------------------------------------------------
// URLSearchParams values arrive as strings — coerce to integers explicitly.
// z.coerce.number() handles "20" → 20 but rejects "abc" and "1abc".
// ---------------------------------------------------------------------------

export const transactionQuerySchema = z.object({
  page: z.coerce
    .number({ error: "page must be a number" })
    .int("page must be an integer")
    .min(1, "page must be at least 1")
    .default(1),

  limit: z.coerce
    .number({ error: "limit must be a number" })
    .int("limit must be an integer")
    .min(1, "limit must be at least 1")
    .max(50, "limit must not exceed 50")
    .default(20),
});

export type TransactionQuery = z.infer<typeof transactionQuerySchema>;
