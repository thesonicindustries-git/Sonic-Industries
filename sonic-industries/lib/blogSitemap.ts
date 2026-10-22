import type { MetadataRoute } from "next";

type BlogItem = {
  slug: string;
  createdAt?: string;
  updatedAt?: string;
};

/**
 * Returns the /blog page + every published blog post for sitemap.ts
 * Only published posts are returned (drafts never reach the sitemap).
 */
export async function getBlogSitemapEntries(
  baseUrl: string
): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/blogs`,
      { next: { revalidate: 3600 } }
    );

    if (!res.ok) return entries;

    const data = await res.json();

    for (const blog of (data.blogs ?? []) as BlogItem[]) {
      entries.push({
        url: `${baseUrl}/blog/${blog.slug}`,
        lastModified: new Date(blog.updatedAt ?? blog.createdAt ?? Date.now()),
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  } catch (error) {
    // If the backend is down, the sitemap still works without blog posts
    console.error("Blog sitemap fetch failed:", error);
  }

  return entries;
}