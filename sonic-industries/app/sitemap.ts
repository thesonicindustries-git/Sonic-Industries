import { CategoryBackend, ProductBackend } from "@/types";
import axios from "axios";
import { MetadataRoute } from "next";
import { getBlogSitemapEntries } from "@/lib/blogSitemap";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const backend = process.env.NEXT_PUBLIC_BACKEND_URL;
  const frontend = process.env.NEXT_PUBLIC_FRONTEND_URL;

  // Fetch categories
  const categoriesRes = await axios.get(`${backend}/api/categories`);
  const categories: CategoryBackend[] = categoriesRes.data.categories || [];

  // Fetch products
  const productsRes = await axios.get(`${backend}/api/products`);
  const products: ProductBackend[] = productsRes.data.products || [];

  // Dynamic URLs from categories
  const categoryUrls: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${frontend}/${category.slug}`,
    lastModified: category.updatedAt || category.createdAt,
    changeFrequency: "weekly",
    priority: 1,
  }));

  // Dynamic URLs from products
  const productUrls: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${frontend}/${product.slug}`,
    lastModified: product.updatedAt || product.createdAt,
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${frontend}/privacy-policy`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${frontend}/refund-policy`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${frontend}/shipping-policy`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${frontend}/terms-and-conditions`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
    const blogEntries = await getBlogSitemapEntries(frontend ?? "");
  // Combine all URLs
  return [...categoryUrls, ...productUrls, ...staticPages, ...blogEntries];
}
