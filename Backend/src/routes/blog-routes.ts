import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  getPublishedBlogs,
  getBlogBySlug,
  getEngagement,
  likeBlog,
  addComment,
  getAllBlogsAdmin,
  createBlog,
  updateBlog,
  deleteBlog,
  getCommentsAdmin,
  deleteComment,
} from "../controllers/blogs-controller";
import { authenticateJWT } from "../middleware/authMiddleware";
import { authorizeRole } from "../middleware/authorizeRole";
import upload from "../config/multer";

const router: Router = Router();

// Extra protection against spam (on top of the one-per-IP rule)
const likeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please try again later." },
});

const commentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many comments. Please try again later." },
});

const adminOnly = [authenticateJWT, authorizeRole("admin")];

// ---- Public ----
router.get("/", getPublishedBlogs);

// ---- Admin (must be above "/:slug" routes) ----
router.get("/admin/all", ...adminOnly, getAllBlogsAdmin);
router.get("/admin/:id/comments", ...adminOnly, getCommentsAdmin);
router.delete("/admin/comments/:commentId", ...adminOnly, deleteComment);
router.post("/", ...adminOnly, upload.single("imageFile"), createBlog);
router.put("/:id", ...adminOnly, upload.single("imageFile"), updateBlog);
router.delete("/:id", ...adminOnly, deleteBlog);

// ---- Public (single post) ----
router.get("/:slug/engagement", getEngagement);
router.get("/:slug", getBlogBySlug);
router.post("/:slug/like", likeLimiter, likeBlog);
router.post("/:slug/comments", commentLimiter, addComment);

export default router;
