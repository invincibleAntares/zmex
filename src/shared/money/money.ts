/**
 * Convert a validated rupee string to integer paise using string arithmetic.
 *
 * We deliberately avoid floating-point arithmetic:
 *   parseFloat("1000.50") * 100 → 100049.99999999999 (precision error)
 *
 * This function is correct for all values accepted by the Zod deposit schema
 * (non-negative, at most 2 decimal places).
 *
 * @example
 * rupeesToPaise("1000.50") → 100050
 * rupeesToPaise("500")     → 50000
 * rupeesToPaise("0.01")    → 1
 * rupeesToPaise("0")       → 0
 */
export function rupeesToPaise(rupees: string): number {
  const [wholePart, fracPart = ""] = rupees.split(".");

  const whole = parseInt(wholePart || "0", 10) * 100;

  // Pad to 2 digits (e.g. "5" → "50") or truncate if somehow longer.
  const fraction = parseInt(fracPart.padEnd(2, "0").slice(0, 2), 10);

  return whole + fraction;
}

/**
 * Maximum permitted opening balance: ₹10,00,000 = 100,000,000 paise.
 * Used by both the Zod schema (validation) and the service (double-check).
 */
export const MAX_INITIAL_DEPOSIT_PAISE = 100_000_000;
