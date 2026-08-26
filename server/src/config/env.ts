import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(5000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  FRONTEND_URL: z.string().url(),

  // Public URL this API server is reachable at (e.g. the Render service
  // URL). Used to build the absolute QR-code image URL embedded in
  // confirmation emails — Brevo's API has no cid/inline-attachment support,
  // so the QR has to be a hosted image rather than an email attachment.
  API_BASE_URL: z.string().url().default("http://localhost:5000"),

  SUPABASE_URL: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  PAYMONGO_SECRET_KEY: z.string().min(1),
  PAYMONGO_PUBLIC_KEY: z.string().min(1),
  PAYMONGO_WEBHOOK_SECRET: z.string().min(1),

  // Optional — booking confirmation emails are skipped (not an error) when
  // these aren't set. See email.service.ts. BREVO_SENDER_EMAIL must be a
  // sender verified in the Brevo dashboard (Senders, Domains & Dedicated
  // IPs > Senders).
  BREVO_API_KEY: z.string().default(""),
  BREVO_SENDER_EMAIL: z.string().default(""),
  BREVO_SENDER_NAME: z.string().default("DinkHub"),
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
