import { randomInt } from "crypto";

// Excludes visually ambiguous characters (0/O, 1/I/L) so a printed or
// handwritten reference stays unambiguous at check-in.
const REFERENCE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateReferenceNumber(prefix: string): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += REFERENCE_CHARS[randomInt(REFERENCE_CHARS.length)];
  }
  return `${prefix}-${code}`;
}
