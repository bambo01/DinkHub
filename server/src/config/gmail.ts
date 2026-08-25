import { lookup } from "node:dns/promises";
import nodemailer from "nodemailer";
import { env } from "./env.js";

// nodemailer's own hostname resolution (lib/shared/index.js) resolves both
// A and AAAA records for the SMTP host and then picks a RANDOM address from
// the combined list — Node's dns.setDefaultResultOrder("ipv4first") has no
// effect on it, since it bypasses dns.lookup entirely. On hosts without real
// IPv6 egress (e.g. Render) that intermittently hands it an unreachable
// IPv6 address, failing with ENETUNREACH/ETIMEDOUT. Resolving to a
// confirmed IPv4 address ourselves before connecting sidesteps that
// resolver entirely. `tls.servername` keeps certificate hostname
// verification working when connecting by IP.
export async function getGmailTransport() {
  const { address } = await lookup("smtp.gmail.com", { family: 4 });

  return nodemailer.createTransport({
    host: address,
    port: 587,
    secure: false,
    requireTLS: true,
    tls: { servername: "smtp.gmail.com" },
    auth: {
      user: env.GMAIL_USER,
      pass: env.GMAIL_APP_PASSWORD,
    },
  });
}
