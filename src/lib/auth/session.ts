import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { env } from "@/config/env";
import { AppError } from "@/shared/errors/app-error";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COOKIE_NAME = "zmex_session";
const SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60; // 7 days

// Encode the secret once at module load — jose requires Uint8Array for HMAC.
const secret = new TextEncoder().encode(env.AUTH_SECRET);

// ---------------------------------------------------------------------------
// Cookie options
// ---------------------------------------------------------------------------

function getSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
    // Secure flag only in production — allows local HTTP dev without HTTPS.
    secure: process.env.NODE_ENV === "production",
  };
}

// ---------------------------------------------------------------------------
// Token creation and verification
// ---------------------------------------------------------------------------

/**
 * Sign a new JWT session token for the given user id.
 * Token payload contains only `sub` (userId) — the DB is the source of truth.
 */
export async function createSessionToken(userId: string): Promise<string> {
  return new SignJWT()
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(secret);
}

/**
 * Verify a JWT and return the user id (sub claim).
 * Throws if the token is expired, malformed, or missing a subject.
 */
export async function verifySessionToken(token: string): Promise<string> {
  const { payload } = await jwtVerify(token, secret);

  const userId = payload.sub;
  if (!userId) {
    throw new Error("JWT missing sub claim");
  }

  return userId;
}

// ---------------------------------------------------------------------------
// Auth helper — used by all protected route handlers
// ---------------------------------------------------------------------------

/**
 * Read the session cookie and return the authenticated user's id.
 *
 * Throws AppError 401/UNAUTHENTICATED when:
 * - cookie is absent
 * - JWT is invalid or expired
 * - JWT subject is missing
 *
 * Internal JWT errors are never leaked to callers.
 *
 * @example
 * const userId = await getAuthenticatedUserId();
 */
export async function getAuthenticatedUserId(): Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    throw new AppError("Authentication required", 401, "UNAUTHENTICATED");
  }

  try {
    return await verifySessionToken(token);
  } catch (error) {
    if (error instanceof AppError) throw error;
    // JWT invalid / expired — do not expose internal details.
    throw new AppError("Authentication required", 401, "UNAUTHENTICATED");
  }
}

// ---------------------------------------------------------------------------
// Cookie helpers for route handlers
// ---------------------------------------------------------------------------

/**
 * Attach the session JWT as an HttpOnly cookie to a response.
 * Call this after creating the token on register/login.
 */
export function setSessionCookie(
  response: NextResponse,
  token: string,
): void {
  response.cookies.set(COOKIE_NAME, token, getSessionCookieOptions());
}

/**
 * Clear the session cookie on logout.
 * Sets maxAge: 0 to instruct the browser to delete the cookie immediately.
 */
export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(COOKIE_NAME, "", {
    ...getSessionCookieOptions(),
    maxAge: 0,
  });
}
