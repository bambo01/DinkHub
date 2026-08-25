import { Router } from "express";
import { getUser, listUsers } from "../controllers/users.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireAdmin } from "../middleware/admin.middleware.js";

const router = Router();

router.use(requireAuth, requireAdmin);

router.get("/", listUsers);
router.get("/:id", getUser);

export default router;
