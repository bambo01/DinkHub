import { Router } from "express";
import {
  createBlockedSlot,
  createCourt,
  deleteBlockedSlot,
  getCourt,
  listBlockedSlots,
  listBookedHours,
  listCourts,
  updateCourt,
} from "../controllers/courts.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireAdmin } from "../middleware/admin.middleware.js";

const router = Router();

// Public — anyone can see courts and their schedules.
router.get("/", listCourts);
router.get("/:id", getCourt);
router.get("/:id/blocked-slots", listBlockedSlots);
router.get("/:id/booked-hours", listBookedHours);

// Admin only — creating/editing courts and managing schedule overrides.
router.post("/", requireAuth, requireAdmin, createCourt);
router.patch("/:id", requireAuth, requireAdmin, updateCourt);
router.post("/:id/blocked-slots", requireAuth, requireAdmin, createBlockedSlot);
router.delete("/:id/blocked-slots/:slotId", requireAuth, requireAdmin, deleteBlockedSlot);

export default router;
