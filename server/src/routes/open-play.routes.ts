import { Router } from "express";
import {
  createActivity,
  deleteActivity,
  getActivity,
  getMyBooking,
  getOpenPlayBooking,
  getParticipants,
  joinActivity,
  listActivities,
  listActivityBookings,
  listMyOpenPlayBookings,
  updateActivity,
  updateActivityImage,
} from "../controllers/open-play.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireAdmin } from "../middleware/admin.middleware.js";
import { imageUpload } from "../middleware/upload.middleware.js";

const router = Router();

// Registered before /:id so "bookings" isn't swallowed as an activity id —
// not that it would be anyway (/:id only ever matches one path segment),
// but this keeps it visually consistent with bookings.routes.ts.
router.get("/bookings/mine", requireAuth, listMyOpenPlayBookings);
router.get("/bookings/:id", requireAuth, getOpenPlayBooking);

// Public — anyone can browse scheduled Open Play activities and see who's
// already confirmed for one.
router.get("/", listActivities);
router.get("/:id", getActivity);
router.get("/:id/participants", getParticipants);

// Logged-in customers reserving a slot.
router.post("/:id/join", requireAuth, joinActivity);
router.get("/:id/my-booking", requireAuth, getMyBooking);

// Admin only — creating/editing activities, and seeing every booking
// (all statuses) for one.
router.post("/", requireAuth, requireAdmin, createActivity);
router.patch("/:id", requireAuth, requireAdmin, updateActivity);
router.delete("/:id", requireAuth, requireAdmin, deleteActivity);
router.patch(
  "/:id/image",
  requireAuth,
  requireAdmin,
  imageUpload.single("image"),
  updateActivityImage,
);
router.get("/:id/bookings", requireAuth, requireAdmin, listActivityBookings);

export default router;
