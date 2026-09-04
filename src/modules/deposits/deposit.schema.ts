import { z } from "zod";
import { rupeesToPaise } from "@/shared/money/money";

export const PAYMENT_METHODS = ["upi", "debit_card", "credit_card"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const MAX_DEPOSIT_PAISE = 1000000 * 100; // ₹10,00,000 = 100,000,000 paise
export const MIN_DEPOSIT_PAISE = 1; // ₹0.01 = 1 paise

export const depositSchema = z.object({
  amount: z
    .string({ error: "Amount is required and must be a string" })
    .trim()
    .regex(
      /^(0|[1-9]\d*)(\.\d{1,2})?$/,
      "Amount must be a valid positive number with up to 2 decimal places (e.g. '500' or '500.50')",
    )
    .refine((val) => {
      const paise = rupeesToPaise(val);
      return paise >= MIN_DEPOSIT_PAISE && paise <= MAX_DEPOSIT_PAISE;
    }, "Amount must be between ₹0.01 and ₹10,00,000"),

  paymentMethod: z.enum(PAYMENT_METHODS, {
    error: "Invalid payment method. Allowed: upi, debit_card, credit_card",
  }),
});

export type DepositInput = z.infer<typeof depositSchema>;
