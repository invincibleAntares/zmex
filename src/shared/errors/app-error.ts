/**
 * AppError — standard application error for all service and route layers.
 *
 * Throw this instead of bare `Error` when the error has a known HTTP status
 * and a machine-readable code that the client can act on.
 *
 * @example
 * throw new AppError("Insufficient balance", 400, "INSUFFICIENT_BALANCE");
 * throw new AppError("Invalid data", 400, "VALIDATION_ERROR", { email: ["Invalid email"] });
 */
export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  /** Optional field-level validation details — safe to send to clients. */
  readonly details?: Record<string, string[]>;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = "INTERNAL_SERVER_ERROR",
    details?: Record<string, string[]>,
  ) {
    super(message);

    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;

    // Restore the correct prototype chain so `instanceof AppError` works
    // after TypeScript compiles to ES5/CommonJS.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
