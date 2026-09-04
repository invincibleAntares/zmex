import { z } from "zod";
import { rupeesToPaise, MAX_INITIAL_DEPOSIT_PAISE } from "@/shared/money/money";

// ---------------------------------------------------------------------------
// Registration schema
// ---------------------------------------------------------------------------

const DEPOSIT_REGEX = /^\d+(\.\d{1,2})?$/;

export const registerSchema = z
  .object({
    fullName: z
      .string({ error: "Full name is required" })
      .trim()
      .min(2, "Full name must be at least 2 characters")
      .max(120, "Full name must be at most 120 characters"),

    email: z
      .string({ error: "Email is required" })
      .trim()
      .email("Enter a valid email address")
      .max(254, "Email address is too long")
      .transform((val) => val.toLowerCase()),

    phone: z
      .string({ error: "Phone number is required" })
      .trim()
      .regex(/^[0-9]{10,15}$/, "Phone must be 10–15 digits (digits only)"),

    password: z
      .string({ error: "Password is required" })
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password must be at most 72 characters"),

    confirmPassword: z
      .string({ error: "Please confirm your password" }),

    // Optional: defaults to "0" when absent. Validated in superRefine below.
    initialDeposit: z.string().default("0"),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Passwords do not match",
      });
    }

    if (!DEPOSIT_REGEX.test(data.initialDeposit)) {
      ctx.addIssue({
        code: "custom",
        path: ["initialDeposit"],
        message:
          "Amount must be a non-negative number with at most 2 decimal places",
      });
      return;
    }

    const paise = rupeesToPaise(data.initialDeposit);
    if (paise > MAX_INITIAL_DEPOSIT_PAISE) {
      ctx.addIssue({
        code: "custom",
        path: ["initialDeposit"],
        message: "Opening deposit cannot exceed ₹10,00,000",
      });
    }
  });

// ---------------------------------------------------------------------------
// Login schema
// ---------------------------------------------------------------------------

export const loginSchema = z.object({
  email: z
    .string({ error: "Email is required" })
    .trim()
    .email("Enter a valid email address")
    .transform((val) => val.toLowerCase()),

  password: z
    .string({ error: "Password is required" })
    .min(1, "Password is required")
    .max(72, "Password is too long"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
