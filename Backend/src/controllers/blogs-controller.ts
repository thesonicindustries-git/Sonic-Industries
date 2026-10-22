import { Request, Response } from "express";
import crypto from "crypto";
import { UploadApiResponse } from "cloudinary";
import cloudinary from "../config/cloudinary";
import { BlogModel } from "../models/blogs.model";
import {
  BlogLikeModel,
  BlogCommentModel,
} from "../models/blogInteractions.model";

/* ---------------------------- helpers ---------------------------- */

// We never store the real IP, only a salted hash of it.
// NOTE: app.set("trust proxy", 1) must be set in index.ts, otherwise on
// Render/Railway every visitor looks like the same IP.
const getIpHash = (req: Request): string => {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const salt = process.env.IP_HASH_SALT || "sonic-blog-default-salt";
  return crypto.createHash("sha256").update(ip + salt).digest("hex");
};

const makeSlug = (title: string): string =>
  title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "post";

const uniqueSlug = async (title: string, ignoreId?: string): Promise<string> => {
  const base = makeSlug(title);
  let slug = base;
  let n = 1;

  while (
    await BlogModel.exists({
      slug,
      ...(ignoreId ? { _id: { $ne: ignoreId } } : {}),
    })
  ) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
};

const makeExcerpt = (content: string): string =>
  content
    .replace(/[#*]/g, " ")
    .replace(/^\s*-\s+/gm, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);

const DEFAULT_BLOG_AUTHOR = "Sonic Industries";

const parseTags = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value !== "string" || !value.trim()) return [];

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    // Fall back to comma-separated tags for multipart form submissions.
  }

  return value.split(",");
};

const cleanTags = (value: unknown): string[] => [
  ...new Set(
    parseTags(value)
      .map((tag) => tag.trim())
      .filter(Boolean)
  ),
];

const validateBlogMetadata = (
  author: string,
  category: string,
  tags: string[]
 ): string | null => {
  if (!author || author.length > 100) return "Author must be 1 to 100 characters.";
  if (category.length > 80) return "Category must be 80 characters or fewer.";
  if (tags.length > 10) return "A blog can have a maximum of 10 tags.";
  if (tags.some((tag) => tag.length > 40)) {
    return "Each tag must be 40 characters or fewer.";
  }
  return null;
};


const uploadCover = (buffer: Buffer): Promise<UploadApiResponse> =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "blogs",
        transformation: [{ fetch_format: "auto", quality: "auto" }],
      },
      (error, result) => {
        if (error || !result) return reject(error);
        resolve(result as UploadApiResponse);
      }
    );
    stream.end(buffer);
  });

const isDuplicateKeyError = (error: unknown): boolean =>
  (error as { code?: number })?.code === 11000;

const publishedBlogFilter = () => ({
  published: true,
  $or: [
    { scheduledAt: null },
    { scheduledAt: { $exists: false } },
    { scheduledAt: { $lte: new Date() } },
  ],
});

const parseScheduledAt = (
  value: unknown
): { date: Date | null; error?: string } => {
  if (value === undefined || value === null || String(value).trim() === "") {
    return { date: null };
  }

  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return { date: null, error: "Scheduled date and time is invalid." };
  }

  return { date };
};

// adds likesCount and commentsCount to a list of blogs
const withCounts = async <T extends { _id: unknown }>(blogs: T[]) => {
  const ids = blogs.map((b) => b._id);

  const [likeAgg, commentAgg] = await Promise.all([
    BlogLikeModel.aggregate([
      { $match: { blogId: { $in: ids } } },
      { $group: { _id: "$blogId", count: { $sum: 1 } } },
    ]),
    BlogCommentModel.aggregate([
      { $match: { blogId: { $in: ids } } },
      { $group: { _id: "$blogId", count: { $sum: 1 } } },
    ]),
  ]);

  const likeMap = new Map(likeAgg.map((x: { _id: unknown; count: number }) => [String(x._id), x.count]));
  const commentMap = new Map(commentAgg.map((x: { _id: unknown; count: number }) => [String(x._id), x.count]));

  return blogs.map((b) => ({
    ...b,
    likesCount: likeMap.get(String(b._id)) ?? 0,
    commentsCount: commentMap.get(String(b._id)) ?? 0,
  }));
};

/* ------------------------- public endpoints ------------------------- */

export const getPublishedBlogs = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const blogs = await BlogModel.find(publishedBlogFilter())
      .sort({ createdAt: -1 })
      .select("-content")
      .lean();

    res.status(200).json({ blogs: await withCounts(blogs) });
  } catch (error) {
    console.error("Error fetching blogs:", error);
    res.status(500).json({ message: "Failed to fetch blogs" });
  }
};

export const getBlogBySlug = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const blog = await BlogModel.findOne({
      slug: String(req.params.slug),
      ...publishedBlogFilter(),
    }).lean();

    if (!blog) {
      res.status(404).json({ message: "Blog not found" });
      return;
    }

    res.status(200).json({ blog });
  } catch (error) {
    console.error("Error fetching blog:", error);
    res.status(500).json({ message: "Failed to fetch blog" });
  }
};

// Likes, comments, and whether THIS visitor (IP) already liked / commented
export const getEngagement = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const blog = await BlogModel.findOne({
      slug: String(req.params.slug),
      ...publishedBlogFilter(),
    }).select("_id");

    if (!blog) {
      res.status(404).json({ message: "Blog not found" });
      return;
    }

    const ipHash = getIpHash(req);

    const [likes, comments, liked, commented] = await Promise.all([
      BlogLikeModel.countDocuments({ blogId: blog._id }),
      BlogCommentModel.find({ blogId: blog._id })
        .sort({ createdAt: -1 })
        .limit(100)
        .select("name text createdAt")
        .lean(),
      BlogLikeModel.exists({ blogId: blog._id, ipHash }),
      BlogCommentModel.exists({ blogId: blog._id, ipHash }),
    ]);

    res.set("Cache-Control", "no-store");
    res.status(200).json({
      likes,
      comments,
      liked: !!liked,
      commented: !!commented,
    });
  } catch (error) {
    console.error("Error fetching engagement:", error);
    res.status(500).json({ message: "Failed to load likes and comments" });
  }
};

export const likeBlog = async (req: Request, res: Response): Promise<void> => {
  try {
    const blog = await BlogModel.findOne({
      slug: String(req.params.slug),
      ...publishedBlogFilter(),
    }).select("_id");

    if (!blog) {
      res.status(404).json({ message: "Blog not found" });
      return;
    }

    let alreadyLiked = false;

    try {
      await BlogLikeModel.create({ blogId: blog._id, ipHash: getIpHash(req) });
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        alreadyLiked = true;
      } else {
        throw error;
      }
    }

    const likes = await BlogLikeModel.countDocuments({ blogId: blog._id });
    res.status(200).json({ liked: true, alreadyLiked, likes });
  } catch (error) {
    console.error("Error liking blog:", error);
    res.status(500).json({ message: "Failed to like this post" });
  }
};

export const addComment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const name = String(req.body?.name ?? "").trim();
    const text = String(req.body?.text ?? "").trim();

    if (name.length < 2 || name.length > 50) {
      res.status(400).json({ message: "Name must be 2 to 50 characters." });
      return;
    }

    if (text.length < 2 || text.length > 500) {
      res.status(400).json({ message: "Comment must be 2 to 500 characters." });
      return;
    }

    const blog = await BlogModel.findOne({
      slug: String(req.params.slug),
      ...publishedBlogFilter(),
    }).select("_id");

    if (!blog) {
      res.status(404).json({ message: "Blog not found" });
      return;
    }

    try {
      const comment = await BlogCommentModel.create({
        blogId: blog._id,
        ipHash: getIpHash(req),
        name,
        text,
      });

      res.status(201).json({
        message: "Comment added",
        comment: {
          _id: comment._id,
          name: comment.name,
          text: comment.text,
          createdAt: comment.createdAt,
        },
      });
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        res
          .status(409)
          .json({ message: "You have already commented on this post." });
        return;
      }
      throw error;
    }
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ message: "Failed to add comment" });
  }
};

/* ------------------------- admin endpoints ------------------------- */

export const getAllBlogsAdmin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const blogs = await BlogModel.find().sort({ createdAt: -1 }).lean();
    res.status(200).json({ blogs: await withCounts(blogs) });
  } catch (error) {
    console.error("Error fetching blogs (admin):", error);
    res.status(500).json({ message: "Failed to fetch blogs" });
  }
};

export const createBlog = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const title = String(req.body?.title ?? "").trim();
    const content = String(req.body?.content ?? "").trim();
    const published = String(req.body?.published) !== "false";
    const scheduled = parseScheduledAt(req.body?.scheduledAt);
    if (scheduled.error) {
      res.status(400).json({ message: scheduled.error });
      return;
    }
    const author = String(req.body?.author ?? DEFAULT_BLOG_AUTHOR).trim() || DEFAULT_BLOG_AUTHOR;
    const category = String(req.body?.category ?? "").trim();
    const tags = cleanTags(req.body?.tags);

    if (!title || title.length > 150) {
      res.status(400).json({ message: "Title is required (max 150 characters)." });
      return;
    }

    if (!content) {
      res.status(400).json({ message: "Blog content is required." });
      return;
    }

    const metadataError = validateBlogMetadata(author, category, tags);
    if (metadataError) {
      res.status(400).json({ message: metadataError });
      return;
    }

    if (!req.file) {
      res.status(400).json({ message: "Cover image is required." });
      return;
    }

    const upload = await uploadCover(req.file.buffer);

    const blog = await BlogModel.create({
      title,
      slug: await uniqueSlug(title),
      excerpt: makeExcerpt(content),
      content,
      coverImageUrl: upload.secure_url,
      author,
      category,
      tags,
      published,
      scheduledAt: scheduled.date,
    });

    res.status(201).json({ message: "Blog created successfully", blog });
  } catch (error) {
    console.error("Error creating blog:", error);
    res.status(500).json({ message: "Failed to create blog" });
  }
};

export const updateBlog = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const blog = await BlogModel.findById(req.params.id);

    if (!blog) {
      res.status(404).json({ message: "Blog not found" });
      return;
    }

    const author = req.body?.author !== undefined
      ? String(req.body.author).trim() || DEFAULT_BLOG_AUTHOR
      : blog.author;
    const category = req.body?.category !== undefined
      ? String(req.body.category).trim()
      : blog.category;
    const tags = req.body?.tags !== undefined
      ? cleanTags(req.body.tags)
      : blog.tags;
    const scheduled = req.body?.scheduledAt !== undefined
      ? parseScheduledAt(req.body.scheduledAt)
      : { date: blog.scheduledAt ?? null };
    if (scheduled.error) {
      res.status(400).json({ message: scheduled.error });
      return;
    }
    const metadataError = validateBlogMetadata(author, category, tags);
    if (metadataError) {
      res.status(400).json({ message: metadataError });
      return;
    }

    if (req.body?.title !== undefined) {
      const title = String(req.body.title).trim();
      if (!title || title.length > 150) {
        res.status(400).json({ message: "Title is required (max 150 characters)." });
        return;
      }
      blog.title = title; // slug stays the same so old links keep working
    }

    if (req.body?.content !== undefined) {
      const content = String(req.body.content).trim();
      if (!content) {
        res.status(400).json({ message: "Blog content is required." });
        return;
      }
      blog.content = content;
      blog.excerpt = makeExcerpt(content);
    }

    if (req.body?.published !== undefined) {
      blog.published = String(req.body.published) !== "false";
    }
    if (req.body?.scheduledAt !== undefined) {
      blog.scheduledAt = scheduled.date;
    }

    if (req.body?.author !== undefined) blog.author = author;
    if (req.body?.category !== undefined) blog.category = category;
    if (req.body?.tags !== undefined) blog.tags = tags;
    if (req.file) {
      const upload = await uploadCover(req.file.buffer);
      blog.coverImageUrl = upload.secure_url;
    }

    await blog.save();
    res.status(200).json({ message: "Blog updated successfully", blog });
  } catch (error) {
    console.error("Error updating blog:", error);
    res.status(500).json({ message: "Failed to update blog" });
  }
};

export const deleteBlog = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const blog = await BlogModel.findByIdAndDelete(req.params.id);

    if (!blog) {
      res.status(404).json({ message: "Blog not found" });
      return;
    }

    await Promise.all([
      BlogLikeModel.deleteMany({ blogId: blog._id }),
      BlogCommentModel.deleteMany({ blogId: blog._id }),
    ]);

    res.status(200).json({ message: "Blog deleted successfully" });
  } catch (error) {
    console.error("Error deleting blog:", error);
    res.status(500).json({ message: "Failed to delete blog" });
  }
};

export const getCommentsAdmin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const comments = await BlogCommentModel.find({ blogId: req.params.id })
      .sort({ createdAt: -1 })
      .select("name text createdAt")
      .lean();

    res.status(200).json({ comments });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ message: "Failed to fetch comments" });
  }
};

export const deleteComment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const comment = await BlogCommentModel.findByIdAndDelete(
      req.params.commentId
    );

    if (!comment) {
      res.status(404).json({ message: "Comment not found" });
      return;
    }

    res.status(200).json({ message: "Comment deleted" });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ message: "Failed to delete comment" });
  }
};
