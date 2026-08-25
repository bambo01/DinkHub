import { createHmac, timingSafeEqual } from "crypto";

// PayMongo signs each webhook request and sends the signature in the
// Paymongo-Signature header, formatted as comma-separated key=value pairs:
// `t=<timestamp>,te=<test-mode signature>,li=<live-mode signature>`. The
// signed value is `${timestamp}.${rawBody}`, HMAC-SHA256'd with the
// endpoint's webhook secret, hex-encoded.
//
// NOTE: PayMongo's own docs page for this exact algorithm (linked from both
// their webhooks and best-practices pages, under a #webhook-signature-
// verification anchor) currently 404s — this is implemented from their
// documented header format and standard HMAC signing convention, but could
// not be re-verified against a live spec at the time this was written. If
// verification rejects real PayMongo events, use the dashboard's "send test
// event" feature to confirm the header format PayMongo is actually sending.
export function verifyPaymongoSignature(
  rawBody: Buffer,
  signatureHeader: string | undefined,
  webhookSecret: string,
): boolean {
  if (!signatureHeader) return false;

  const parts: Record<string, string> = {};
  for (const part of signatureHeader.split(",")) {
    const [key, value] = part.split("=");
    if (key && value) parts[key] = value;
  }

  const timestamp = parts.t;
  // Prefer the live-mode signature; fall back to test-mode (only one of the
  // two will actually be present/valid depending on which keys created the
  // event).
  const signature = parts.li || parts.te;
  if (!timestamp || !signature) return false;

  const signedPayload = `${timestamp}.${rawBody.toString("utf8")}`;
  const expected = createHmac("sha256", webhookSecret)
    .update(signedPayload)
    .digest("hex");

  const expectedBuffer = Buffer.from(expected, "utf8");
  const signatureBuffer = Buffer.from(signature, "utf8");

  // timingSafeEqual throws on mismatched lengths rather than returning
  // false, so that has to be checked explicitly first.
  if (expectedBuffer.length !== signatureBuffer.length) return false;

  return timingSafeEqual(expectedBuffer, signatureBuffer);
}
