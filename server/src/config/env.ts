import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(5000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  FRONTEND_URL: z.string().url(),

  SUPABASE_URL: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  PAYMONGO_SECRET_KEY: z.string().min(1),
  PAYMONGO_PUBLIC_KEY: z.string().min(1),
  PAYMONGO_WEBHOOK_SECRET: z.string().min(1),

  // Optional — booking confirmation emails are skipped (not an error) when
  // these aren't set. See email.service.ts. GMAIL_APP_PASSWORD is a Gmail
  // App Password (Google Account > Security > App passwords), not the
  // account's regular login password.
  GMAIL_USER: z.string().default(""),
  GMAIL_APP_PASSWORD: z.string().default(""),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid or missing environment variables:");
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;
