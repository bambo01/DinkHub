import nodemailer from "nodemailer";
import { env } from "./env.js";

export const gmailTransport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: env.GMAIL_USER,
    pass: env.GMAIL_APP_PASSWORD,
  },
});
