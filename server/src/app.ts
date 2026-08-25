import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";
import { handlePaymongoWebhook } from "./controllers/payments.controller.js";
import routes from "./routes/index.js";

const app = express();

// Render (and most PaaS hosts) sit the app behind a reverse proxy, which
// sets X-Forwarded-For on every request — without this, express-rate-limit
// can't tell real client IPs apart and warns/misbehaves accordingly.
app.set("trust proxy", 1);

app.use(helmet());

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  }),
);

// General ceiling for all API traffic — generous enough that ordinary
// browsing (page loads, admin tables, dashboards each firing a few fetches)
// doesn't exhaust it. Brute-force protection on login/register lives in a
// separate, much stricter limiter on those specific routes instead of
// sharing this budget with unrelated reads.
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    message: {
      success: false,
      message: "Too many requests. Please wait a moment and try again.",
    },
  }),
);

// The PayMongo webhook needs the raw request body to verify its signature —
// must be mounted before the global JSON parser below, and as its own
// literal path (not through the /api router, which assumes parsed JSON).
app.post(
  "/api/payments/webhook/paymongo",
  express.raw({ type: "application/json" }),
  handlePaymongoWebhook,
);

app.use(express.json());

app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
