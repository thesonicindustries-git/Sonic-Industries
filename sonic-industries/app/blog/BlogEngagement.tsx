"use client";

import { useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import { Heart, MessageCircle } from "lucide-react";
import { toast } from "sonner";

type Comment = {
  _id: string;
  name: string;
  text: string;
  createdAt: string;
};

const API = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/blogs`;

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export default function BlogEngagement({ slug }: { slug: string }) {
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [liked, setLiked] = useState(false);
  const [commented, setCommented] = useState(false);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [liking, setLiking] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`${API}/${slug}/engagement`);
        setLikes(res.data.likes);
        setComments(res.data.comments);
        setLiked(res.data.liked);
        setCommented(res.data.commented);
      } catch (error) {
        console.error("Failed to load engagement:", error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [slug]);

  const handleLike = async () => {
    if (liked || liking) return;

    setLiking(true);
    try {
      const res = await axios.post(`${API}/${slug}/like`);
      setLikes(res.data.likes);
      setLiked(true);
      if (res.data.alreadyLiked) {
        toast.info("You have already liked this post.");
      }
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      toast.error(error.response?.data?.message || "Could not like this post.");
    } finally {
      setLiking(false);
    }
  };

  const handleComment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (commented || submitting) return;

    if (name.trim().length < 2 || text.trim().length < 2) {
      toast.error("Please enter your name and a comment.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await axios.post(`${API}/${slug}/comments`, {
        name: name.trim(),
        text: text.trim(),
      });

      setComments((prev) => [res.data.comment, ...prev]);
      setCommented(true);
      setName("");
      setText("");
      toast.success("Comment added!");
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      if (error.response?.status === 409) setCommented(true);
      toast.error(error.response?.data?.message || "Could not add your comment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-12 border-t border-gray-200 pt-8">
      {/* Like */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleLike}
          disabled={liked || liking || loading}
          aria-label="Like this post"
          className={`flex items-center gap-2 rounded-full border px-5 py-2 text-sm font-medium transition ${
            liked
              ? "border-red-200 bg-red-50 text-red-600"
              : "border-gray-300 text-gray-700 hover:border-red-300 hover:text-red-600"
          } disabled:cursor-not-allowed`}
        >
          <Heart className={`h-5 w-5 ${liked ? "fill-red-600" : ""}`} />
          {liked ? "Liked" : "Like"}
        </button>

        <span className="text-sm text-gray-600">
          {likes} {likes === 1 ? "like" : "likes"}
        </span>
      </div>

      {/* Comments */}
      <div className="mt-10">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
          <MessageCircle className="h-5 w-5" />
          Comments ({comments.length})
        </h2>

        {commented ? (
          <p className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
            Thanks! You have already commented on this post.
          </p>
        ) : (
          <form onSubmit={handleComment} className="mt-4 space-y-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              placeholder="Your name"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={500}
              rows={4}
              placeholder="Write your comment (you can comment once per post)"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">{text.length}/500</span>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-blue-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:bg-gray-400"
              >
                {submitting ? "Posting..." : "Post Comment"}
              </button>
            </div>
          </form>
        )}

        <div className="mt-8 space-y-4">
          {comments.length === 0 && !loading && (
            <p className="text-sm text-gray-500">No comments yet. Be the first!</p>
          )}

          {comments.map((comment) => (
            <div
              key={comment._id}
              className="rounded-lg border border-gray-100 bg-gray-50 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-gray-900">
                  {comment.name}
                </span>
                <span className="text-xs text-gray-400">
                  {formatDate(comment.createdAt)}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-line wrap-break-word text-sm text-gray-700">
                {comment.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
