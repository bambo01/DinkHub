import { Router } from "express";
import { getMyLoyalty, redeem } from "../controllers/loyalty.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth);

router.get("/me", getMyLoyalty);
router.post("/redeem", redeem);

export default router;
