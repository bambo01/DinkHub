import { Router } from "express";
import { getByReference } from "../controllers/verify.controller.js";

const router = Router();

// Public, no auth — this is exactly what the QR code / reference number is
// for: showing booking details to whoever scans it (staff at check-in, or
// the customer themselves).
router.get("/:reference", getByReference);

export default router;
