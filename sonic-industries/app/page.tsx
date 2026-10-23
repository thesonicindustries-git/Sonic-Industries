import HomeClient from "./HomeClient";
import { CategoryBackend, ProductBackend } from "@/types";
import type { Metadata } from "next";

// SEO metadata for the home page
export const metadata: Metadata = {
  title: "Sonic Industries | Packaging Machinery Manufacturer",
  description:
    "Sonic Industries is a leading manufacturer of packaging machinery, coding solutions, and automation systems across India.",
};

// Fetch categories
const getCategories = async (): Promise<CategoryBackend[]> => {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/categories`,
      {
        next: { revalidate: 3600 },
      },
    );

    if (!res.ok) return [];

    const data = await res.json();

    return Array.isArray(data.categories) ? data.categories : [];
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
};

// Fetch products
const getProducts = async (): Promise<ProductBackend[]> => {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/products`,
      {
        next: { revalidate: 3600 },
      },
    );

    if (!res.ok) return [];

    const data = await res.json();

    return Array.isArray(data.products) ? data.products : [];
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
};

// Home page
export default async function Home() {
  const categories = await getCategories();
  const products = await getProducts();

  const categoryImages: Record<string, string | null> = {};

  // Use the first matching product image for each category
  categories.forEach((category) => {
    const categoryProducts = products.filter((product) =>
      product.categoryId?._id === category._id &&
      Array.isArray(product.images) &&
      product.images.length > 0,
    );
    const firstProduct = categoryProducts.find((product) => product.isPriority) ?? categoryProducts[0];

    categoryImages[category._id] =
      firstProduct?.images?.[0] ?? null;
  });

  return (
    <HomeClient
      categories={categories}
      products={products}
      categoryImages={categoryImages}
    />
  );
}