import { Router } from "express";
import authRoutes from "./auth.routes.js";
import usersRoutes from "./users.routes.js";
import courtsRoutes from "./courts.routes.js";
import bookingsRoutes from "./bookings.routes.js";
import paymentsRoutes from "./payments.routes.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({
    success: true,
    data: { status: "ok" },
  });
});

router.use("/auth", authRoutes);
router.use("/users", usersRoutes);
router.use("/courts", courtsRoutes);
router.use("/bookings", bookingsRoutes);
router.use("/payments", paymentsRoutes);

export default router;
