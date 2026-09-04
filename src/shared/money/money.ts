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
  if (!rupees || typeof rupees !== "string" || rupees.trim() === "") {
    return 0;
  }
  const clean = rupees.trim();
  const [wholePart, fracPart = ""] = clean.split(".");

  const whole = (parseInt(wholePart || "0", 10) || 0) * 100;

  // Pad to 2 digits (e.g. "5" -> "50") or truncate if longer.
  const fraction = parseInt(fracPart.padEnd(2, "0").slice(0, 2), 10) || 0;

  const result = whole + fraction;
  return isNaN(result) ? 0 : result;
}

/**
 * Maximum permitted opening balance: ₹10,00,000 = 100,000,000 paise.
 * Used by both the Zod schema (validation) and the service (double-check).
 */
export const MAX_INITIAL_DEPOSIT_PAISE = 100_000_000;

export const MIN_DEPOSIT_PAISE = 500 * 100;

/** Maximum allowed single transfer: ₹10,00,000 */
export const MAX_TRANSFER_PAISE = 1000000 * 100;
