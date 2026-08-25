import { setDefaultResultOrder } from "node:dns";
import app from "./app.js";
import { env } from "./config/env.js";

// Render's containers don't have real IPv6 egress — without this, outbound
// connections (e.g. Gmail SMTP) that resolve an IPv6 address first fail
// with ENETUNREACH/ETIMEDOUT instead of falling back to IPv4.
setDefaultResultOrder("ipv4first");

app.listen(env.PORT, () => {
  console.log(`Pickleball API listening on port ${env.PORT} (${env.NODE_ENV})`);
});
