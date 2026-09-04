import { z } from "zod";
import { accountNumberSchema } from "@/modules/accounts/account.schema";

// ---------------------------------------------------------------------------
// Transfer validation
// ---------------------------------------------------------------------------

export const transferSchema = z.object({
  // Reuse exact account number format logic (ZM + 12 digits, trims + uppercases)
  recipientAccountNumber: accountNumberSchema.shape.accountNumber,

  // Decimal string, e.g. "500", "500.50", "0.01". Must be > 0.
  amount: z
    .string({ error: "Amount is required and must be a string" })
    .trim()
    .regex(
      /^(0|[1-9]\d*)(\.\d{1,2})?$/,
      "Amount must be a valid positive number with up to 2 decimal places (e.g. '500' or '500.50')",
    )
    .refine((val) => {
      const num = parseFloat(val);
      return num > 0;
    }, "Amount must be strictly greater than 0"),

  note: z
    .string()
    .max(255, "Note must be 255 characters or fewer")
    .trim()
    // Convert empty/whitespace-only notes to undefined consistently.
    .transform((val) => (val === "" ? undefined : val))
    .optional(),
});

export type TransferInput = z.infer<typeof transferSchema>;
