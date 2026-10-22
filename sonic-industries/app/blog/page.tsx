import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Heart, MessageCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog | Sonic Industries",
  description:
    "Tips, guides and updates on packaging machines, band sealers and coding printers from Sonic Industries.",
};

type BlogListItem = {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImageUrl: string;
  author: string;
  category: string;
  tags: string[];
  published: boolean;
  createdAt: string;
  updatedAt: string;
  likesCount: number;
  commentsCount: number;
};

const API = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/blogs`;

async function getBlogs(): Promise<BlogListItem[]> {
  try {
    const res = await fetch(API, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.blogs) ? data.blogs : [];
  } catch {
    return [];
  }
}

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export default async function BlogPage() {
  const blogs = await getBlogs();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Our Blog</h1>
        <p className="mx-auto mt-3 max-w-2xl text-gray-600">
          Guides, tips and updates from the Sonic Industries team.
        </p>
      </div>

      {blogs.length === 0 ? (
        <p className="py-16 text-center text-gray-500">
          No posts yet. Please check back soon.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {blogs.map((blog) => (
            <Link
              key={blog._id}
              href={`/blog/${blog.slug}`}
              className="group overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="relative aspect-video w-full overflow-hidden bg-gray-100">
                <Image
                  src={blog.coverImageUrl}
                  alt={blog.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-contain"
                />
              </div>

              <div className="p-4">
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                  <span>{formatDate(blog.createdAt)}</span>
                  {blog.category && (
                    <>
                      <span aria-hidden="true">&middot;</span>
                      <span>{blog.category}</span>
                    </>
                  )}
                </div>
                <h2 className="mt-1 line-clamp-2 text-lg font-semibold text-gray-900 group-hover:text-red-600">
                  {blog.title}
                </h2>
                <p className="mt-1 text-xs text-gray-500">By {blog.author}</p>
                <p className="mt-2 line-clamp-3 text-sm text-gray-600">
                  {blog.excerpt}
                </p>

              
              

                <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Heart className="h-3.5 w-3.5" /> {blog.likesCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-3.5 w-3.5" /> {blog.commentsCount}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}