/**
 * AppError — standard application error for all service and route layers.
 *
 * Throw this instead of bare `Error` when the error has a known HTTP status
 * and a machine-readable code that the client can act on.
 *
 * @example
 * throw new AppError("Insufficient balance", 400, "INSUFFICIENT_BALANCE");
 */
export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = "INTERNAL_SERVER_ERROR",
  ) {
    super(message);

    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;

    // Restore the correct prototype chain so `instanceof AppError` works
    // after TypeScript compiles to ES5/CommonJS.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
