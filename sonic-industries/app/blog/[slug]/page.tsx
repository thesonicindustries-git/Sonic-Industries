import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import BlogReadMore from "../BlogReadMore";
import BlogCategoryImage from "../BlogCategoryImage";
import BlogEngagement from "../BlogEngagement";

type Blog = {
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
  createdAt: string;
  updatedAt: string;
};

const API = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/blogs`;
const CATEGORIES_API = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/categories`;

type WebsiteCategory = {
  name: string;
  slug: string;
};

async function getCategoryHref(categoryName: string): Promise<string | null> {
  if (!categoryName) return null;

  try {
    const res = await fetch(CATEGORIES_API, { next: { revalidate: 300 } });
    if (!res.ok) return null;

    const data = await res.json();
    const categories: WebsiteCategory[] = Array.isArray(data.categories)
      ? data.categories
      : [];
    const category = categories.find(
      (item) => item.name.trim().toLowerCase() === categoryName.trim().toLowerCase()
    );

    return category?.slug ? `/${category.slug}` : null;
  } catch {
    return null;
  }
}

async function getBlog(slug: string): Promise<Blog | null> {
  try {
    const res = await fetch(`${API}/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.blog && typeof data.blog === "object" ? data.blog : null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const blog = await getBlog(slug);

  if (!blog) return { title: "Post not found | Sonic Industries" };

  const siteUrl = process.env.NEXT_PUBLIC_FRONTEND_URL ?? "";
  const canonicalUrl = `${siteUrl}/blog/${blog.slug}`;

  return {
    title: blog.title,
    description: blog.excerpt,
    keywords: blog.tags,
    authors: [{ name: blog.author || "Sonic Industries" }],
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: blog.title,
      description: blog.excerpt,
      url: canonicalUrl,
      siteName: "Sonic Industries",
      images: [
        {
          url: blog.coverImageUrl,
          alt: blog.title,
          width: 1200,
          height: 630,
        },
      ],
      publishedTime: blog.createdAt,
      modifiedTime: blog.updatedAt,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: blog.title,
      description: blog.excerpt,
      images: [blog.coverImageUrl],
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const blog = await getBlog(slug);

  if (!blog) notFound();

  const date = new Date(blog.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const categoryHref = await getCategoryHref(blog.category);

  const siteUrl = process.env.NEXT_PUBLIC_FRONTEND_URL ?? "";
  const pageUrl = `${siteUrl}/blog/${blog.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: blog.title,
    description: blog.excerpt,
    image: [blog.coverImageUrl],
    datePublished: blog.createdAt,
    dateModified: blog.updatedAt,
    author: {
      "@type": blog.author ? "Person" : "Organization",
      name: blog.author || "Sonic Industries",
      url: siteUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "Sonic Industries",
      url: siteUrl,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/opengraph-image.png`,
      },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${siteUrl}/blog` },
      { "@type": "ListItem", position: 3, name: blog.title, item: pageUrl },
    ],
  };

  return (
    <article className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-gray-600">
        <Link href="/" className="hover:text-red-600">Home</Link>
        <span aria-hidden="true" className="mx-2">/</span>
        <Link href="/blog" className="hover:text-red-600">Blog</Link>
        <span aria-hidden="true" className="mx-2">/</span>
        <span className="text-gray-500">{blog.title}</span>
      </nav>

      <Link
        href="/blog"
        className="mb-6 inline-flex items-center gap-2 text-sm text-gray-600 transition hover:text-red-600"
      >
        <ArrowLeft className="h-4 w-4" /> All posts
      </Link>

      <h1 className="text-3xl font-extrabold leading-tight text-gray-900 sm:text-4xl">
        {blog.title}
      </h1>
      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-500">
        <span>By {blog.author}</span>
        <span aria-hidden="true">&middot;</span>
        <span aria-hidden="true">&middot;</span>
        {blog.category && (
          <>
            <span aria-hidden="true">&middot;</span>
            {categoryHref ? (
              <Link href={categoryHref} className="text-red-600 hover:underline">
                {blog.category}
              </Link>
            ) : (
              <span>{blog.category}</span>
            )}
          </>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-500">
       <time dateTime={blog.createdAt}>{date}</time>
        </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c") }}
      />

      <div className="relative mt-6">
        {categoryHref ? (
          <BlogCategoryImage
            href={categoryHref}
            imageUrl={blog.coverImageUrl}
            title={blog.title}
          />
        ) : (
          <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-gray-100">
            <Image
              src={blog.coverImageUrl}
              alt={blog.title}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-contain"
            />
          </div>
        )}
      </div>

      <div className="mt-8">
        <BlogReadMore content={blog.content} />
      </div>
          {blog.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {blog.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
              #{tag}
            </span>
          ))}
        </div>
      )}
      <BlogEngagement slug={blog.slug} />
      
    </article>
  );
}