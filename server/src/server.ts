import { setDefaultResultOrder } from "node:dns";
import app from "./app.js";
import { env } from "./config/env.js";

// Render's containers don't have real IPv6 egress — without this, outbound
// connections that resolve an IPv6 address first fail with
// ENETUNREACH/ETIMEDOUT instead of falling back to IPv4.
setDefaultResultOrder("ipv4first");

// Explicit "0.0.0.0" matters on Render: listen(port) alone can bind in a
// way its port scanner fails to detect, which fails the deploy with
// "Port scan timeout reached, no open ports detected" even though the
// process is actually listening.
app.listen(env.PORT, "0.0.0.0", () => {
  console.log(`Pickleball API listening on port ${env.PORT} (${env.NODE_ENV})`);
});
