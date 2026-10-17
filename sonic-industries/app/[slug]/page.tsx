import Navbar from "./NavBar";
import HeroSection from "./HeroSection";
import About from "./About";
import ProductIntro from "./ProductIntro";
import Hotspots from "./Hotspots";
import DealsOfWeek from "./DealsOfWeek";
import ProductVariants from "./ProductVariants";
import WhyChooseUs from "./WhyChooseUs";
import ProductComparison from "./ProductComparison";
import Testimonials from "./Testimonials";
import FAQs from "./FAQs";
import ContactUs from "./ContactUs";
import Footer from "./Footer";
import type { Metadata } from "next";
import { CategoryBackend, CategoryImages, ProductBackend } from "@/types";
import { notFound } from "next/navigation";
import Script from "next/script";
import ProductIntro2 from "./ProductIntro2";

type Props = {
  params: Promise<{ slug: string }>;
};

// Fetch product data (server-side)
const getCategory = async (slug: string): Promise<CategoryBackend | null> => {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/categories/${slug}`,
      { next: { revalidate: 3600 } },
    );

    if (!res.ok) return null;
    const data = await res.json();
    return data.category;
  } catch (error) {
    console.error("Error fetching category:", error);
    return null;
  }
};

const getSingleProduct = async (
  slug: string,
): Promise<ProductBackend | null> => {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/products/${slug}`,
      { next: { revalidate: 3600 } },
    );

    if (!res.ok) return null;
    const data = await res.json();
    return data.product;
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
};

const getAllProductsUnderCategory = async (
  id: string | undefined,
): Promise<CategoryImages> => {
  if (!id) return { products: [], images: [] };
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/categories/${id}/images`,
      { next: { revalidate: 3600 } },
    );

    if (!res.ok) return { products: [], images: [] };
    const data = await res.json();
    return {
      products: Array.isArray(data.products) ? data.products : [],
      images: Array.isArray(data.images) ? data.images : [],
    };
  } catch (error) {
    console.error("Error fetching products under category:", error);
    return { products: [], images: [] };
  }
};

export async function generateStaticParams() {
  try {
    const [catRes, productRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/categories`),
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/products`),
    ]);

    if (!catRes.ok || !productRes.ok) return [];

    const catData = await catRes.json();
    const productData = await productRes.json();

    const categorySlugs = catData.categories.map((cat: CategoryBackend) => ({
      slug: cat.slug,
    }));

    const productSlugs = productData.products.map(
      (product: ProductBackend) => ({
        slug: product.slug,
      }),
    );

    return [...categorySlugs, ...productSlugs];
  } catch (error) {
    console.error("Error generating static params:", error);
    return [];
  }
}

// ✅ Dynamic metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  const allProductData = await getAllProductsUnderCategory(category?._id);

  if (category) {
    return {
      title: category ? `${category.name}` : "Sonic Industries",
      description:
        category?.description ||
        "Explore high-quality packaging and coding machinery from Sonic Industries.",
      keywords: category?.keywords || [
        "sonic industries",
        "packaging machinery",
        "capping machinery",
        "batch coding",
        "vacuum packaging",
        "band sealer",
        "inkjet printer",
        "labeling machine",
        "industrial machinery",
        "packaging equipment",
        "sealing machine",
        "vacuum sealer",
        "industrial packaging",
        "coding equipment",
        "packaging solutions",
        "industrial sealing",
        "packaging technology",
        "machinery for packaging",
        "industrial labeling",
        "packaging automation",
      ],
      openGraph: {
        title: category?.name || "Sonic Industries",
        description:
          category?.description ||
          "Explore high-quality packaging and coding machinery from Sonic Industries.",
        url: `${process.env.NEXT_PUBLIC_FRONTEND_URL}/${slug}`,
        type: "website",
        siteName: "Sonic Industries",
        images: [
          {
            url: allProductData.images?.[0] || allProductData.images?.[1],
            width: 1200,
            height: 630,
            alt: "Sonic Industries Product Showcase",
          },
        ],
      },
      twitter: {
        title: category ? `${category.name}` : "Sonic Industries",
        description:
          category?.description ||
          "Explore high-quality packaging and coding machinery from Sonic Industries.",
        images: [
          {
            url: allProductData.images?.[0] || allProductData.images?.[1],
            width: 1200,
            height: 630,
            alt: "Sonic Industries Product Showcase",
          },
        ],
        card: "summary_large_image",
        creator: "Kunal Barot",
      },
    };
  }

  const product = await getSingleProduct(slug);
  if (product) {
    return {
      title: product ? `${product.name}` : "Sonic Industries",
      description:
        product?.description ||
        "Explore high-quality packaging and coding machinery from Sonic Industries.",
      keywords: product?.keywords || [
        "sonic industries",
        "packaging machinery",
        "capping machinery",
        "batch coding",
        "vacuum packaging",
        "band sealer",
        "inkjet printer",
        "labeling machine",
        "industrial machinery",
        "packaging equipment",
        "sealing machine",
        "vacuum sealer",
        "industrial packaging",
        "coding equipment",
        "packaging solutions",
        "industrial sealing",
        "packaging technology",
        "machinery for packaging",
        "industrial labeling",
        "packaging automation",
      ],
      openGraph: {
        title: product?.name || "Sonic Industries",
        description:
          product?.description ||
          "Explore high-quality packaging and coding machinery from Sonic Industries.",
        url: `${process.env.NEXT_PUBLIC_FRONTEND_URL}/${slug}`,
        type: "website",
        siteName: "Sonic Industries",
        images: [
          {
            url: product?.images[0] || product?.images[1],
            width: 1200,
            height: 630,
            alt: "Sonic Industries Product Showcase",
          },
        ],
      },
      twitter: {
        title: product ? `${product.name}` : "Sonic Industries",
        description:
          product?.description ||
          "Explore high-quality packaging and coding machinery from Sonic Industries.",
        images: [
          {
            url: product?.images[0] || product?.images[1],
            width: 1200,
            height: 630,
            alt: "Sonic Industries Product Showcase",
          },
        ],
        card: "summary_large_image",
        creator: "Kunal Barot",
      },
    };
  }

  return {
    title: "Page Not Found | Sonic Industries",
  };
}

// ✅ Page itself
export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const categoryData: CategoryBackend | null = await getCategory(slug);

  if (categoryData) {
    const allProductData = await getAllProductsUnderCategory(categoryData?._id);

    return (
      <main className="w-full min-w-0 overflow-x-hidden">
        <Navbar />
        <div className="h-16 sm:h-20" aria-hidden="true" />
        <span id="home" className="block scroll-mt-20" aria-hidden="true" />

        <Script id="ld-json-category" type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: categoryData.name,
            description: categoryData.description,
            url: `${process.env.NEXT_PUBLIC_FRONTEND_URL}/${categoryData.slug}`,
          })}
        </Script>

        <Script id="ld-json-breadcrumb-category" type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: categoryData.name,
                item: `${process.env.NEXT_PUBLIC_FRONTEND_URL}/${categoryData.slug}`,
              },
            ],
          })}
        </Script>

        <HeroSection
          productData={categoryData}
          allProductData={allProductData}
        />
        <About />
        <ProductIntro
          productData={categoryData}
          parentCategoryData={null}
          allProductData={allProductData}
        />
        <ProductIntro2
          productData={categoryData}
          parentCategoryData={null}
          allProductData={allProductData}
        />
        <DealsOfWeek />
        <ProductVariants productData={categoryData} />
        <WhyChooseUs productData={null} allProductData={allProductData} />
        <ProductComparison allProductData={allProductData} />
        <Testimonials />
        <FAQs allProductData={allProductData} />
        <ContactUs />
        <Footer productData={null} allProductData={allProductData} />
      </main>
    );
  }

  const productData: ProductBackend | null = await getSingleProduct(slug);
  if (productData) {
    const parentCategoryData: CategoryBackend | null = await getCategory(
      productData.categoryId.slug,
    );
    const allProductData = await getAllProductsUnderCategory(
      productData.categoryId._id,
    );

    return (
      <main className="w-full min-w-0 overflow-x-hidden">
        <Navbar />
        <div className="h-16 sm:h-20" aria-hidden="true" />
        <span id="home" className="block scroll-mt-20" aria-hidden="true" />

        <Script id="ld-json-product" type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: productData.name,
            description: productData.description,
            image: productData.images[0],
            brand: {
              "@type": "Brand",
              name: "Sonic Industries",
            },
            offers: {
              "@type": "Offer",
              priceCurrency: "INR",
              price: productData?.price ?? "0",
              availability: "https://schema.org/InStock",
              url: `${process.env.NEXT_PUBLIC_FRONTEND_URL}/${productData.slug}`,
            },
          })}
        </Script>

        <Script id="ld-json-breadcrumb-product" type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: parentCategoryData?.name,
                item: `${process.env.NEXT_PUBLIC_FRONTEND_URL}/${parentCategoryData?.slug}`,
              },
              {
                "@type": "ListItem",
                position: 2,
                name: productData.name,
                item: `${process.env.NEXT_PUBLIC_FRONTEND_URL}/${productData.slug}`,
              },
            ],
          })}
        </Script>

        <HeroSection
          productData={productData}
          allProductData={allProductData}
        />
        <About />
        <ProductIntro
          productData={productData}
          parentCategoryData={parentCategoryData}
          allProductData={allProductData}
        />
        <ProductIntro2
          productData={productData}
          parentCategoryData={parentCategoryData}
          allProductData={allProductData}
        />
        <Hotspots productData={productData} allProductData={allProductData} />
        <DealsOfWeek />
        <ProductVariants productData={parentCategoryData} />
        <WhyChooseUs productData={productData} allProductData={null} />
        <ProductComparison allProductData={allProductData} />
        <Testimonials />
        <FAQs allProductData={allProductData} />
        <ContactUs />
        <Footer productData={productData} allProductData={null} />
      </main>
    );
  }

  notFound();
}
