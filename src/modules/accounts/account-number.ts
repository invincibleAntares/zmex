import { randomInt } from "crypto";

const PREFIX = "ZM";
const DIGIT_COUNT = 12;

/**
 * Generate a cryptographically secure ZMEX account number.
 *
 * Format: ZM + 12 random numeric digits
 * Example: ZM583920184726
 *
 * Uses Node's `crypto.randomInt` — never Math.random().
 * The database enforces uniqueness via a unique constraint.
 * The caller (auth service) must handle the extremely rare collision
 * by retrying with a new number.
 */
export function generateAccountNumber(): string {
  const digits = Array.from(
    { length: DIGIT_COUNT },
    () => randomInt(0, 10),
  ).join("");

  return `${PREFIX}${digits}`;
}
