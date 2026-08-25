import { Router } from "express";
import {
  createCheckoutSession,
  createOpenPlayCheckoutSession,
  listPayments,
} from "../controllers/payments.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireAdmin } from "../middleware/admin.middleware.js";

const router = Router();

// The PayMongo webhook is NOT mounted here — it needs the raw request body
// for signature verification, so it's wired directly in app.ts ahead of the
// global express.json() parser. See app.ts for why.
router.post("/create-checkout", requireAuth, createCheckoutSession);
router.post("/create-open-play-checkout", requireAuth, createOpenPlayCheckoutSession);
router.get("/", requireAuth, requireAdmin, listPayments);

export default router;
