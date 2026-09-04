// ---------------------------------------------------------------------------
// Safe public shapes — safe to include in API responses.
// Password hashes, JWT tokens, and raw DB types are never used here.
// ---------------------------------------------------------------------------

/** User fields safe to return from any API endpoint. */
export interface PublicUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
}

/** Extended user — includes createdAt for /api/auth/me. */
export interface CurrentUser extends PublicUser {
  createdAt: Date;
}

/** Account fields safe to return from registration response. */
export interface PublicAccount {
  id: string;
  accountNumber: string;
  balancePaise: number;
}

// ---------------------------------------------------------------------------
// Service return types
// ---------------------------------------------------------------------------

/** Returned by AuthService.register — user + account, no secrets. */
export interface RegistrationResult {
  user: PublicUser;
  account: PublicAccount;
}

/** Returned by AuthService.login — user only, no balance exposed. */
export interface LoginResult {
  user: PublicUser;
}

// ---------------------------------------------------------------------------
// Internal types — used inside the repository/service boundary only.
// ---------------------------------------------------------------------------

/** All data the repository needs to atomically create a user and account. */
export interface CreateUserAccountData {
  fullName: string;
  email: string;
  phone: string;
  passwordHash: string;
  accountNumber: string;
  initialDepositPaise: number;
}
