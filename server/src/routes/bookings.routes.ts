import { Router } from "express";
import {
  createBooking,
  getBooking,
  listBookings,
  listMyBookings,
} from "../controllers/bookings.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireAdmin } from "../middleware/admin.middleware.js";

const router = Router();

// Every booking route requires a logged-in user — this is the server-side
// enforcement of "you must be logged in to check out" (the frontend gate on
// the checkout page is a UX nicety on top of this, not the real boundary).
router.use(requireAuth);

router.get("/", requireAdmin, listBookings);
router.post("/", createBooking);
// Registered before /:id so "mine" isn't swallowed as an id param.
router.get("/mine", listMyBookings);
router.get("/:id", getBooking);

export default router;
