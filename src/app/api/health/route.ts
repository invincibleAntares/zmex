import { sql } from "drizzle-orm";
import { db } from "@/db";
import { successResponse, errorResponse } from "@/shared/http/api-response";

// Use the Node.js runtime — Edge Runtime does not support the `ws` module
// required for Neon WebSocket connections.
export const runtime = "nodejs";

export async function GET() {
  try {
    // Execute a minimal query to verify the database connection is live.
    await db.execute(sql`SELECT 1`);

    return successResponse({
      status: "ok",
      database: "connected",
      service: "ZMEX API",
    });
  } catch (error) {
    return errorResponse(error);
  }
}
