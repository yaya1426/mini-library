import { z } from "zod";

const postgresUrlSchema = z
  .string({
    error: "DATABASE_URL is required",
  })
  .trim()
  .min(1, "DATABASE_URL is required")
  .refine(
    (value) => {
      try {
        const parsed = new URL(value);
        return (
          (parsed.protocol === "postgres:" ||
            parsed.protocol === "postgresql:") &&
          parsed.hostname.length > 0
        );
      } catch {
        return false;
      }
    },
    {
      message:
        "DATABASE_URL must be a valid PostgreSQL URL (postgres:// or postgresql://)",
    },
  );

export const envSchema = z.object({
  DATABASE_URL: postgresUrlSchema,
  SESSION_SECRET: z
    .string({
      error: "SESSION_SECRET is required",
    })
    .trim()
    .min(1, "SESSION_SECRET is required"),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(
  rawEnv: Record<string, string | undefined> = process.env,
): Env {
  const result = envSchema.safeParse({
    DATABASE_URL: rawEnv.DATABASE_URL,
    SESSION_SECRET: rawEnv.SESSION_SECRET,
    NODE_ENV: rawEnv.NODE_ENV ?? "development",
  });

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(
      `Invalid environment configuration:\n${details}\nCheck your .env file against .env.example.`,
    );
  }

  return result.data;
}
