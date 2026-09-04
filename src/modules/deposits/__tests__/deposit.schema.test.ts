import assert from "node:assert";
import { depositSchema } from "../deposit.schema";

console.log("Running deposit validation unit tests...");

// 1. VALID AMOUNTS
const validAmounts = ["0.01", "500", "500.50", "1000000"];
for (const amount of validAmounts) {
  const result = depositSchema.safeParse({ amount, paymentMethod: "upi" });
  assert.strictEqual(
    result.success,
    true,
    `Expected valid amount '${amount}' to pass validation`,
  );
}
console.log("✅ Valid amounts passed");

// 2. REJECTED AMOUNTS
const rejectedAmounts = [
  "0",
  "0.00",
  "-1",
  "-100",
  "500.999",
  "abc",
  "1000000.01",
  "1000001",
  "NaN",
  "Infinity",
  "1e5",
];
for (const amount of rejectedAmounts) {
  const result = depositSchema.safeParse({ amount, paymentMethod: "upi" });
  assert.strictEqual(
    result.success,
    false,
    `Expected invalid amount '${amount}' to fail validation`,
  );
}
console.log("✅ Invalid amounts rejected");

// 3. VALID PAYMENT METHODS
const validMethods = ["upi", "debit_card", "credit_card"];
for (const paymentMethod of validMethods) {
  const result = depositSchema.safeParse({ amount: "500", paymentMethod });
  assert.strictEqual(
    result.success,
    true,
    `Expected valid payment method '${paymentMethod}' to pass validation`,
  );
}
console.log("✅ Valid payment methods passed");

// 4. REJECTED PAYMENT METHODS
const rejectedMethods = ["cash", "bank_transfer", "crypto", "", "upi_v2"];
for (const paymentMethod of rejectedMethods) {
  const result = depositSchema.safeParse({ amount: "500", paymentMethod });
  assert.strictEqual(
    result.success,
    false,
    `Expected invalid payment method '${paymentMethod}' to fail validation`,
  );
}
console.log("✅ Invalid payment methods rejected");

console.log("All deposit validation unit tests passed successfully!");
