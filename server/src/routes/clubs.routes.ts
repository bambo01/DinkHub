import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  acceptInvite,
  createClub,
  createComment,
  createInvite,
  createPost,
  createSession,
  deleteClub,
  deleteComment,
  deletePost,
  deleteSession,
  getClub,
  joinClub,
  leaveClub,
  likePost,
  listClubs,
  listComments,
  listInvites,
  listMembers,
  listMessages,
  listPosts,
  listSessions,
  pinPost,
  previewInvite,
  revokeInvite,
  respondToSession,
  sendMessage,
  updateClub,
  updateClubImage,
  updateSessionStatus,
} from "../controllers/clubs.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireAdmin } from "../middleware/admin.middleware.js";
import { imageUpload } from "../middleware/upload.middleware.js";

const router = Router();

// Chat is polled every few seconds by every open tab, which would burn
// through the app-wide limiter (see CHAT_PATH in app.ts, which exempts these
// routes from it) in minutes — so it gets its own, much more generous one.
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  message: { success: false, message: "You're chatting too fast. Please slow down." },
});

router.use(requireAuth);

router.get("/", listClubs);
router.post("/", requireAdmin, createClub);

// Registered before /:id — invite tokens are opaque strings, not club ids.
router.get("/invites/:token", previewInvite);
router.post("/invites/:token/accept", acceptInvite);

router.get("/:id", getClub);
router.patch("/:id", requireAdmin, updateClub);
router.delete("/:id", requireAdmin, deleteClub);
router.patch("/:id/image", requireAdmin, imageUpload.single("image"), updateClubImage);

router.get("/:id/invites", requireAdmin, listInvites);
router.post("/:id/invites", requireAdmin, createInvite);
router.delete("/:id/invites/:inviteId", requireAdmin, revokeInvite);

router.post("/:id/join", joinClub);
router.delete("/:id/join", leaveClub);

// Feed & announcements — any member posts; the author or an admin deletes;
// only an admin pins.
router.get("/:id/posts", listPosts);
router.post("/:id/posts", imageUpload.single("image"), createPost);
router.delete("/:id/posts/:postId", deletePost);
router.patch("/:id/posts/:postId/pin", requireAdmin, pinPost);
router.put("/:id/posts/:postId/like", likePost);
router.get("/:id/posts/:postId/comments", listComments);
router.post("/:id/posts/:postId/comments", createComment);
router.delete("/:id/posts/:postId/comments/:commentId", deleteComment);

router.get("/:id/members", listMembers);

// Scheduling — admin opens a session for sign-ups; members answer IN/OUT.
router.get("/:id/sessions", listSessions);
router.post("/:id/sessions", requireAdmin, createSession);
router.patch("/:id/sessions/:sessionId", requireAdmin, updateSessionStatus);
router.delete("/:id/sessions/:sessionId", requireAdmin, deleteSession);
router.put("/:id/sessions/:sessionId/response", respondToSession);

router.get("/:id/messages", chatLimiter, listMessages);
router.post("/:id/messages", chatLimiter, sendMessage);

export default router;
