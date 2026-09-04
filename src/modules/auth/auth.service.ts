import bcrypt from "bcryptjs";
import { generateAccountNumber } from "@/modules/accounts/account-number";
import { rupeesToPaise } from "@/shared/money/money";
import { AppError } from "@/shared/errors/app-error";
import {
  createUserWithAccount,
  findUserByEmail,
  findUserById,
  isAccountNumberCollision,
  isEmailCollision,
  isPhoneCollision,
} from "./auth.repository";
import type { RegisterInput, LoginInput } from "./auth.schema";
import type {
  RegistrationResult,
  LoginResult,
  CurrentUser,
} from "./auth.types";

const BCRYPT_ROUNDS = 12;
const MAX_ACCOUNT_NUMBER_ATTEMPTS = 5;

// Pre-computed dummy hash for constant-time login when email is not found.
// Prevents timing-based email enumeration attacks.
// The plaintext is irrelevant — we never return true from a dummy comparison.
const DUMMY_HASH =
  "$2b$12$invalidhashvaluethatisusedtofakebcryptworkloadXXXXXX";

// ---------------------------------------------------------------------------
// register
// ---------------------------------------------------------------------------

/**
 * Validate, hash, and persist a new user + account atomically.
 * Retries on account-number collision (extremely rare).
 * Maps database constraint violations to typed AppErrors.
 */
export async function register(
  input: RegisterInput,
): Promise<RegistrationResult> {
  const initialDepositPaise = rupeesToPaise(input.initialDeposit);
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  for (let attempt = 1; attempt <= MAX_ACCOUNT_NUMBER_ATTEMPTS; attempt++) {
    const accountNumber = generateAccountNumber();

    try {
      return await createUserWithAccount({
        fullName: input.fullName,
        email: input.email, // already lowercased by Zod schema
        phone: input.phone,
        passwordHash,
        accountNumber,
        initialDepositPaise,
      });
    } catch (error) {
      if (isAccountNumberCollision(error)) {
        if (attempt === MAX_ACCOUNT_NUMBER_ATTEMPTS) {
          console.error("[ZMEX] Account number: all retry attempts exhausted");
          throw new AppError(
            "Account creation failed. Please try again.",
            500,
            "ACCOUNT_CREATION_FAILED",
          );
        }
        // Try a new account number
        continue;
      }

      if (isEmailCollision(error)) {
        throw new AppError(
          "An account already exists with this email",
          409,
          "EMAIL_ALREADY_EXISTS",
        );
      }

      if (isPhoneCollision(error)) {
        throw new AppError(
          "An account already exists with this phone number",
          409,
          "PHONE_ALREADY_EXISTS",
        );
      }

      // Unknown DB or application error — surface through standard handler.
      throw error;
    }
  }

  // Unreachable — loop always returns or throws. Satisfies TypeScript.
  throw new AppError(
    "Account creation failed. Please try again.",
    500,
    "ACCOUNT_CREATION_FAILED",
  );
}

// ---------------------------------------------------------------------------
// login
// ---------------------------------------------------------------------------

/**
 * Verify credentials and return the safe user record on success.
 *
 * Both "email not found" and "wrong password" return the same
 * INVALID_CREDENTIALS error to prevent user enumeration.
 *
 * bcrypt.compare always runs (even when user is not found) to keep
 * response time consistent and resist timing-based email discovery.
 */
export async function login(input: LoginInput): Promise<LoginResult> {
  const user = await findUserByEmail(input.email);

  // Always run bcrypt to prevent timing-based enumeration.
  const hashToCompare = user?.passwordHash ?? DUMMY_HASH;
  const passwordMatch = await bcrypt.compare(input.password, hashToCompare);

  if (!user || !passwordMatch) {
    throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
  }

  return {
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
    },
  };
}

// ---------------------------------------------------------------------------
// getCurrentUser
// ---------------------------------------------------------------------------

/**
 * Look up the authenticated user by id for the /api/auth/me endpoint.
 * Returns 401 instead of 404 if the user no longer exists — prevents
 * leaking whether a given user id ever existed.
 */
export async function getCurrentUser(userId: string): Promise<CurrentUser> {
  const user = await findUserById(userId);

  if (!user) {
    throw new AppError("Authentication required", 401, "UNAUTHENTICATED");
  }

  return user;
}
