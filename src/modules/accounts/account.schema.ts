import { z } from "zod";

// ---------------------------------------------------------------------------
// Account number validation
// ---------------------------------------------------------------------------
// Mirrors the format defined in account-number.ts: ZM + 12 numeric digits.
// Input is trimmed and uppercased before the regex check so that a user
// typing "zm583920184726" is treated the same as "ZM583920184726".
// ---------------------------------------------------------------------------

const ACCOUNT_NUMBER_REGEX = /^ZM[0-9]{12}$/;

export const accountNumberSchema = z.object({
  accountNumber: z
    .string({ error: "Account number is required" })
    .trim()
    .toUpperCase()
    .regex(
      ACCOUNT_NUMBER_REGEX,
      "Account number must be in the format ZM followed by 12 digits (e.g. ZM583920184726)",
    ),
});

export type AccountNumberInput = z.infer<typeof accountNumberSchema>;
