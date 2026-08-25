import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  changePassword,
  forgotPassword,
  getMe,
  login,
  register,
  resetPassword,
  updateAvatar,
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { imageUpload } from "../middleware/upload.middleware.js";

const router = Router();

// Brute-force protection — much tighter than the general API limiter, and
// scoped only to the credential-guessing-relevant routes so it can't be
// exhausted by unrelated traffic elsewhere in the app.
const credentialsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: {
    success: false,
    message: "Too many attempts. Please wait a moment and try again.",
  },
});

router.post("/login", credentialsLimiter, login);
router.post("/register", credentialsLimiter, register);
router.post("/forgot-password", credentialsLimiter, forgotPassword);
router.post("/reset-password", credentialsLimiter, resetPassword);
router.get("/me", requireAuth, getMe);
router.patch("/me/avatar", requireAuth, imageUpload.single("avatar"), updateAvatar);
router.post("/change-password", requireAuth, changePassword);

export default router;
