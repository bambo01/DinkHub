import nodemailer from "nodemailer";
import { env } from "./env.js";

// Explicit host/port 587 (STARTTLS) rather than the "gmail" service shorthand
// (which defaults to port 465) — some hosts (e.g. Render's free tier) block
// outbound 465 but allow 587.
export const gmailTransport = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: env.GMAIL_USER,
    pass: env.GMAIL_APP_PASSWORD,
  },
});
