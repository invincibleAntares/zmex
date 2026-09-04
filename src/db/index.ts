import { neon, neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import { env } from "@/config/env";

// Configure Neon to use the Node.js `ws` WebSocket implementation.
// Required when running in the Node.js runtime (not Edge).
// This enables proper multi-statement transactions and row-level locking
// which the banking transfer engine will need in later steps.
neonConfig.webSocketConstructor = ws;

// ---------------------------------------------------------------------------
// Connection pool
// ---------------------------------------------------------------------------
// In Next.js development, hot-module replacement re-executes module
// initializers on every file change. We store the pool on `globalThis` to
// prevent unbounded connection growth during development.
// In production this branch is never taken — modules are evaluated once.
// ---------------------------------------------------------------------------

declare global {
  // eslint-disable-next-line no-var
  var __neonPool: Pool | undefined;
}

function createPool(): Pool {
  return new Pool({ connectionString: env.DATABASE_URL });
}

const pool: Pool =
  process.env.NODE_ENV === "production"
    ? createPool()
    : (globalThis.__neonPool ??= createPool());

export const db = drizzle(pool);
