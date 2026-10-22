"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";
import type { CategoryBackend } from "@/types";
import { Pencil, Trash2, MessageSquare, Heart, Plus, X } from "lucide-react";

type AdminBlog = {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  author: string;
  category: string;
  tags: string[];
  published: boolean;
  scheduledAt: string | null;
  createdAt: string;
  updatedAt: string;
  likesCount: number;
  commentsCount: number;
};

type AdminComment = {
  _id: string;
  name: string;
  text: string;
  createdAt: string;
};

const API = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/blogs`;
const MAX_COVER_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_COVER_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const errorMessage = (err: unknown, fallback: string) =>
  (err as AxiosError<{ message?: string }>).response?.data?.message || fallback;

const toDateTimeLocal = (value: string | null | undefined) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
};

const isScheduledBlog = (blog: AdminBlog) =>
  blog.published &&
  !!blog.scheduledAt &&
  new Date(blog.scheduledAt).getTime() > Date.now();

export default function BlogDashboard() {
  const [blogs, setBlogs] = useState<AdminBlog[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<CategoryBackend[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("Sonic Industries");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [content, setContent] = useState("");
  const [published, setPublished] = useState(true);
  const [scheduledAt, setScheduledAt] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const previewObjectUrl = useRef<string | null>(null);

  // comments panel
  const [openCommentsFor, setOpenCommentsFor] = useState<string | null>(null);
  const [comments, setComments] = useState<AdminComment[]>([]);

  const loadBlogs = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/admin/all`, { headers: authHeaders() });
      setBlogs(res.data.blogs);
    } catch (err) {
      toast.error(errorMessage(err, "Failed to load blogs"));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/categories`
      );
      setCategories(Array.isArray(res.data.categories) ? res.data.categories : []);
    } catch {
      setCategories([]);
      toast.error("Failed to load categories");
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBlogs();
    loadCategories();
  }, [loadBlogs, loadCategories]);

  const clearPreviewObjectUrl = () => {
    if (previewObjectUrl.current) {
      URL.revokeObjectURL(previewObjectUrl.current);
      previewObjectUrl.current = null;
    }
  };

  useEffect(() => () => clearPreviewObjectUrl(), []);

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setTitle("");
    setAuthor("Sonic Industries");
    setCategory("");
    setTags("");
    setContent("");
    setPublished(true);
    setScheduledAt("");
    setImageFile(null);
    clearPreviewObjectUrl();
    setPreview("");
  };

  const startEdit = (blog: AdminBlog) => {
    setEditingId(blog._id);
    setTitle(blog.title);
    setAuthor(blog.author || "Sonic Industries");
    setCategory(blog.category || "");
    setTags((blog.tags || []).join(", "));
    setContent(blog.content);
    setPublished(blog.published);
    setScheduledAt(toDateTimeLocal(blog.scheduledAt));
    setImageFile(null);
    clearPreviewObjectUrl();
    setPreview(blog.coverImageUrl);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleImage = (file: File | undefined) => {
    if (!file) return;
    if (!ALLOWED_COVER_IMAGE_TYPES.includes(file.type)) {
      toast.error("Please choose a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_COVER_IMAGE_SIZE) {
      toast.error("Cover image must be 5 MB or smaller.");
      return;
    }
    clearPreviewObjectUrl();
    const objectUrl = URL.createObjectURL(file);
    previewObjectUrl.current = objectUrl;
    setImageFile(file);
    setPreview(objectUrl);
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Title and blog content are required.");
      return;
    }

    if (!editingId && !imageFile) {
      toast.error("Please choose a cover image.");
      return;
    }

    const payload = new FormData();
    payload.append("title", title.trim());
    payload.append("author", author.trim() || "Sonic Industries");
    payload.append("category", category.trim());
    payload.append("tags", JSON.stringify(tags.split(",").map((tag) => tag.trim()).filter(Boolean)));
    payload.append("content", content);
    payload.append("published", String(published));
    payload.append(
      "scheduledAt",
      scheduledAt ? new Date(scheduledAt).toISOString() : ""
    );
    if (imageFile) payload.append("imageFile", imageFile);

    setSaving(true);
    try {
      if (editingId) {
        await axios.put(`${API}/${editingId}`, payload, { headers: authHeaders() });
        toast.success("Blog updated");
      } else {
        await axios.post(API, payload, { headers: authHeaders() });
        toast.success("Blog created");
      }
      resetForm();
      await loadBlogs();
    } catch (err) {
      toast.error(errorMessage(err, "Failed to save blog"));
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (blog: AdminBlog) => {
    try {
      const payload = new FormData();
      payload.append("published", String(!blog.published));
      await axios.put(`${API}/${blog._id}`, payload, { headers: authHeaders() });
      toast.success(blog.published ? "Moved to draft" : "Published");
      await loadBlogs();
    } catch (err) {
      toast.error(errorMessage(err, "Failed to update"));
    }
  };

  const handleDelete = async (blog: AdminBlog) => {
    if (!confirm(`Delete "${blog.title}"? Its likes and comments will be deleted too.`)) {
      return;
    }

    try {
      await axios.delete(`${API}/${blog._id}`, { headers: authHeaders() });
      toast.success("Blog deleted");
      if (openCommentsFor === blog._id) setOpenCommentsFor(null);
      await loadBlogs();
    } catch (err) {
      toast.error(errorMessage(err, "Failed to delete blog"));
    }
  };

  const toggleComments = async (blogId: string) => {
    if (openCommentsFor === blogId) {
      setOpenCommentsFor(null);
      return;
    }

    try {
      const res = await axios.get(`${API}/admin/${blogId}/comments`, {
        headers: authHeaders(),
      });
      setComments(res.data.comments);
      setOpenCommentsFor(blogId);
    } catch (err) {
      toast.error(errorMessage(err, "Failed to load comments"));
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!confirm("Delete this comment?")) return;

    try {
      await axios.delete(`${API}/admin/comments/${commentId}`, {
        headers: authHeaders(),
      });
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      toast.success("Comment deleted");
      await loadBlogs();
    } catch (err) {
      toast.error(errorMessage(err, "Failed to delete comment"));
    }
  };

  return (
    <div className="max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Blog</h1>
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
          >
            <Plus className="h-4 w-4" />
            New Post
          </button>
        )}
      </div>

      {/* ---------- Create / Edit form ---------- */}
      {showForm && (
        <div aria-busy={saving} className="mb-8 space-y-4 rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">
              {editingId ? "Edit Post" : "New Post"}
            </h2>
            <button type="button" onClick={resetForm} className="rounded p-1 text-gray-500 hover:bg-gray-100">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div>
            <label htmlFor="blog-title" className="mb-1 block text-sm font-medium text-gray-700">Title *</label>
            <input
              id="blog-title"
              type="text"
              value={title}
              maxLength={150}
              disabled={saving}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Blog title"
              aria-describedby="blog-title-count"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p id="blog-title-count" className="mt-1 text-right text-xs text-gray-500">{title.length}/150</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="blog-author" className="mb-1 block text-sm font-medium text-gray-700">Author *</label>
              <input
                id="blog-author"
                type="text"
                value={author}
                maxLength={100}
                disabled={saving}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Author name"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="blog-category" className="mb-1 block text-sm font-medium text-gray-700">Category</label>
              <select
                id="blog-category"
                value={category}
                disabled={saving || categoriesLoading}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">
                  {categoriesLoading ? "Loading categories..." : "Select a category (optional)"}
                </option>
                {category && !categories.some((item) => item.name === category) && (
                  <option value={category}>{category} (current)</option>
                )}
                {categories
                  .slice()
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((item) => (
                    <option key={item._id} value={item.name}>
                      {item.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="blog-tags" className="mb-1 block text-sm font-medium text-gray-700">Tags</label>
            <input
              id="blog-tags"
              type="text"
              value={tags}
              disabled={saving}
              onChange={(e) => setTags(e.target.value)}
              placeholder="packaging, sealing, machinery"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">Comma-separated, maximum 10 tags.</p>
          </div>

          <div>
            <label htmlFor="cover-image" className="mb-1 block text-sm font-medium text-gray-700">
              Cover Image {editingId ? "(leave empty to keep the current one)" : "*"}
            </label>
            <input
              id="cover-image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={saving}
              onChange={(e) => handleImage(e.target.files?.[0])}
            />
            <p className="mt-1 text-xs text-gray-500">JPG, PNG, or WebP - max 5 MB</p>
            {preview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt="Cover preview"
                className="mt-3 aspect-video w-full max-w-sm rounded-lg border object-contain"
              />
            )}
          </div>

          <div>
            <label htmlFor="blog-content" className="mb-1 block text-sm font-medium text-gray-700">
              Blog Content *
            </label>
            <p className="mt-1 text-xs text-gray-500">
              Formatting: <code>## Heading</code>, <code>### Small heading</code>,{" "}
              <code>- bullet point</code>, <code>**bold**</code>. Leave an empty line
              between paragraphs.
            </p>
            <textarea
              id="blog-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={50000}
              disabled={saving}
              rows={14}
              placeholder={"Write your blog here...\n\n## Heading\nA paragraph of text.\n\n- Point one\n- Point two"}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-right text-xs text-gray-500">{content.length}/50000</p>
          </div>

          <div>
            <label htmlFor="blog-scheduled-at" className="mb-1 block text-sm font-medium text-gray-700">
              Schedule publication (optional)
            </label>
            <input
              id="blog-scheduled-at"
              type="datetime-local"
              value={scheduledAt}
              disabled={saving}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:max-w-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              Choose a date and time in your local timezone. The post will remain hidden until then.
            </p>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              id="publish-blog"
              type="checkbox"
              checked={published}
              disabled={saving}
              onChange={(e) => setPublished(e.target.checked)}
            />
            Publish on website (uncheck to save as draft)
          </label>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-blue-600 px-5 py-2 text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : editingId ? "Save Changes" : "Create Post"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              disabled={saving}
              className="rounded-lg border border-gray-300 px-5 py-2 text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ---------- Posts list ---------- */}
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : blogs.length === 0 ? (
        <p className="text-gray-500">No posts yet. Click &quot;New Post&quot; to write one.</p>
      ) : (
        <div className="space-y-4">
          {blogs.map((blog) => (
            <div key={blog._id} className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex flex-col gap-4 sm:flex-row">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={blog.coverImageUrl}
                  alt={blog.title}
                  className="aspect-video w-full rounded-lg object-contain sm:w-44"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{blog.title}</h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        isScheduledBlog(blog)
                          ? "bg-blue-100 text-blue-700"
                          : blog.published
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {isScheduledBlog(blog) ? "Scheduled" : blog.published ? "Published" : "Draft"}
                    </span>
                  </div>

                  <p className="mt-1 line-clamp-2 text-sm text-gray-600">{blog.excerpt}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    /blog/{blog.slug} ·{" "}
                    Updated {new Date(blog.updatedAt).toLocaleDateString("en-IN")}
                  </p>

                  <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Heart className="h-4 w-4" /> {blog.likesCount}
                    </span>
                    <button
                      onClick={() => toggleComments(blog._id)}
                      className="flex items-center gap-1 hover:text-blue-600"
                    >
                      <MessageSquare className="h-4 w-4" /> {blog.commentsCount} comments
                    </button>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => startEdit(blog)}
                      className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
                    >
                      <Pencil className="h-4 w-4" /> Edit
                    </button>
                    <button
                      onClick={() => togglePublish(blog)}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
                    >
                      {blog.published ? "Unpublish" : "Publish"}
                    </button>
                    <button
                      onClick={() => handleDelete(blog)}
                      className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" /> Delete
                    </button>
                  </div>
                </div>
              </div>

              {/* Comments moderation */}
              {openCommentsFor === blog._id && (
                <div className="mt-4 space-y-2 border-t border-gray-100 pt-4">
                  {comments.length === 0 ? (
                    <p className="text-sm text-gray-500">No comments on this post.</p>
                  ) : (
                    comments.map((comment) => (
                      <div
                        key={comment._id}
                        className="flex items-start justify-between gap-3 rounded-lg bg-gray-50 p-3"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {comment.name}{" "}
                            <span className="text-xs font-normal text-gray-400">
                              {new Date(comment.createdAt).toLocaleDateString("en-IN")}
                            </span>
                          </p>
                          <p className="wrap-break-word text-sm text-gray-700">{comment.text}</p>
                        </div>
                        <button
                          onClick={() => deleteComment(comment._id)}
                          className="shrink-0 rounded p-1 text-red-600 hover:bg-red-50"
                          aria-label="Delete comment"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}