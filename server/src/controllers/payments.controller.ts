import type { Request, Response } from "express";
import { env } from "../config/env.js";
import * as paymentsService from "../services/payments.service.js";
import { createCheckoutSessionSchema } from "../validators/payments.validator.js";
import { verifyPaymongoSignature } from "../utils/paymongo-signature.js";

export async function createCheckoutSession(req: Request, res: Response) {
  const input = createCheckoutSessionSchema.parse(req.body);
  const result = await paymentsService.createCheckoutSession(req.userId!, input.bookingId);
  res.status(201).json({ success: true, data: result });
}

export async function listPayments(_req: Request, res: Response) {
  const payments = await paymentsService.listPayments();
  res.status(200).json({ success: true, data: payments });
}

// Mounted with express.raw() ahead of the global JSON parser (see app.ts) —
// req.body is the raw Buffer here, which signature verification requires.
export async function handlePaymongoWebhook(req: Request, res: Response) {
  const rawBody = req.body as Buffer;
  const signatureHeader = req.header("Paymongo-Signature");

  if (!verifyPaymongoSignature(rawBody, signatureHeader, env.PAYMONGO_WEBHOOK_SECRET)) {
    res.status(400).json({ success: false, message: "Invalid signature" });
    return;
  }

  let event: unknown;
  try {
    event = JSON.parse(rawBody.toString("utf8"));
  } catch {
    res.status(400).json({ success: false, message: "Invalid payload" });
    return;
  }

  // Acknowledge immediately per PayMongo's guidance — a slow handler risks
  // the 30s timeout and needless retries. Everything below is a best-effort
  // reconciliation; any failure just waits for PayMongo's automatic retry.
  res.status(200).json({ success: true, data: null });

  const eventType = (event as { data?: { attributes?: { type?: string } } })?.data
    ?.attributes?.type;

  // Only checkout_session.payment.paid is handled — every other subscribed
  // or unexpected event type is acknowledged and ignored, per PayMongo's
  // guidance to never error on an event type the handler doesn't act on.
  if (eventType !== "checkout_session.payment.paid") return;

  const checkoutSessionId = (
    event as { data?: { attributes?: { data?: { id?: string } } } }
  )?.data?.attributes?.data?.id;
  if (typeof checkoutSessionId !== "string") return;

  try {
    await paymentsService.reconcileCheckoutSession(checkoutSessionId);
  } catch (err) {
    console.error("Failed to reconcile PayMongo checkout session:", err);
  }
}
