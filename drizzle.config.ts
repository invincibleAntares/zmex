import "dotenv/config";
import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "[ZMEX] drizzle.config.ts: DATABASE_URL is not set.\n" +
      "       Create a .env.local file with your Neon connection string.\n" +
      "       See .env.example for the expected format.",
  );
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema/**",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  strict: true,
  verbose: true,
});
