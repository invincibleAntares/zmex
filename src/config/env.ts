import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z
    .string({ error: "DATABASE_URL is required and must be a non-empty string" })
    .min(1, "DATABASE_URL must not be empty"),
});

function validateEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const missing = result.error.issues
      .map((issue) => issue.path.join("."))
      .join(", ");

    console.error(
      `[ZMEX] Configuration error — missing or invalid environment variables: ${missing}\n` +
        `       Check your .env.local file and ensure all required variables are set.\n` +
        `       See .env.example for reference.`,
    );

    throw new Error(
      `Missing required environment variables: ${missing}`,
    );
  }

  return result.data;
}

export const env = validateEnv();
