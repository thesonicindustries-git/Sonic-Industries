"use client";

import { CategoryBackend, CategoryImages, ProductBackend } from "@/types";
import { Ripple } from "../ui/ripple";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { ArrowRight } from "lucide-react";

interface HeroSectionProps {
  productData: CategoryBackend | ProductBackend;
  allProductData: CategoryImages;
}

export default function HeroSection({
  productData,
  allProductData,
}: HeroSectionProps) {
  const router = useRouter();
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const [rippleSize, setRippleSize] = useState(80);

  useEffect(() => {
    if (productData?.name) {
      document.title = `${productData.name} | Sonic Industries`;
    }
  }, [productData]);

  useEffect(() => {
    const container = imageContainerRef.current;
    if (!container) return;

    const updateRippleSize = () => {
      const size = Math.min(container.clientWidth, container.clientHeight);
      // 5 circles add 280px in total, so all circles fit inside the square.
      setRippleSize(Math.max(40, Math.min(260, size - 280)));
    };

    updateRippleSize();
    const observer = new ResizeObserver(updateRippleSize);
    observer.observe(container);

    return () => observer.disconnect();
  }, []);
  function isCategory(
    data: CategoryBackend | ProductBackend,
  ): data is CategoryBackend {
    return "title" in data;
  }

  const isCategoryPage = isCategory(productData);

  const displayTitle = isCategoryPage
    ? productData.title || "Untitled"
    : productData.tagline || "Untitled";

  const siblingProducts = !isCategoryPage
    ? allProductData.products.filter((item) => item.slug !== productData.slug)
    : allProductData.products;

  const heroImage = isCategoryPage
    ? allProductData.images?.[0] // category → any product image
    : productData.images?.[0]; // product → its own image

  const handleBuyNow = async (productId: string) => {
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/payment/checkout`,
        { productId },
      );

      const { checkoutSessionToken } = res.data;
      router.push(`/checkout?token=${checkoutSessionToken}`);
    } catch (error) {
      console.error("Error initiating checkout:", error);
    }
  };

  return (
    <section className="w-full overflow-x-hidden bg-white px-4 py-12 sm:py-16">
      <div className="max-w-7xl mx-auto flex flex-col-reverse lg:flex-row items-center lg:items-start gap-10 lg:gap-14">
        {/* Text Section */}
        <div className="w-full lg:w-1/2 text-center lg:text-left">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-snug mb-5">
            {displayTitle}
          </h1>

          <ul className="text-gray-700 text-sm sm:text-base md:text-lg max-w-xl mx-auto lg:mx-0 list-disc list-inside space-y-2 mb-8">
            {productData.description}
          </ul>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <button
              className="bg-red-600 hover:bg-red-700 transition-all duration-300 text-white font-medium px-6 sm:px-8 py-3 rounded-md uppercase text-sm sm:text-base cursor-pointer tracking-normal hover:tracking-wider"
              onClick={() => {
                if (isCategoryPage) {
                  document.getElementById("products")?.scrollIntoView({
                    behavior: "smooth",
                  });
                } else {
                  handleBuyNow(productData._id); // ✅ product purchase
                }
              }}
            >
              Buy Now
            </button>

            {isCategoryPage ? (
              <button
                className="group flex justify-center items-center gap-2.5 border border-red-500 text-red-500 hover:bg-blue-50 transition-all duration-300 font-medium px-6 sm:px-8 py-3 rounded-md uppercase text-sm sm:text-base cursor-pointer tracking-normal hover:tracking-wider"
                onClick={() => {
                  document.getElementById("features")?.scrollIntoView({
                    behavior: "smooth",
                  });
                }}
              >
                Learn More
                <ArrowRight
                  width={20}
                  height={20}
                  className="transition-transform duration-250 group-hover:translate-x-1"
                />
              </button>
            ) : (
              "price" in productData && (
                <div className="group w-full sm:w-auto inline-flex items-stretch rounded-[10px] overflow-hidden border border-blue-300 hover:border-blue-500 transition-all duration-200 cursor-pointer">
                  {/* Label */}
                  <div className="bg-blue-50 group-hover:bg-blue-100 px-12.5 md:px-8.5 xl:px-6.5 py-2 flex items-center border-r border-blue-300 group-hover:border-blue-500 transition-all duration-200">
                    <span className="text-xs sm:text-sm font-medium tracking-widest uppercase text-blue-500 group-hover:text-blue-700 transition-colors duration-200">
                      Price
                    </span>
                  </div>

                  {/* Value */}
                  <div className="flex-1 px-3 sm:px-4 py-2 bg-white group-hover:bg-blue-50 flex items-center justify-center sm:justify-start transition-all duration-200">
                    <span className="text-sm sm:text-md font-semibold text-black-700 tracking-normal group-hover:tracking-wider transition-all duration-200">
                      ₹{productData.price}
                    </span>
                  </div>
                </div>
              )
            )}
          </div>

          {/* Sibling Products */}
          {/* Sibling Products */}
          {(isCategoryPage || siblingProducts.length > 0) && (
            <div className="mt-10">
              <div className="flex flex-wrap gap-4 justify-center lg:justify-start pb-2">
                {siblingProducts.map((item) => (
                  <div
                    key={item._id}
                    className="flex flex-col items-center cursor-pointer w-24"
                    onClick={() => router.push(item.slug)}
                  >
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24">
                      <span
                        className="absolute inset-1 rounded-full border-4 bg-cover bg-top"
                        style={{
                          backgroundImage: `url('${item.images[0]}')`,
                        }}
                      />
                    </div>
                    <span className="mt-2 text-xs sm:text-sm text-center">
                      {item.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Image Section */}
        <div className="w-full lg:w-1/2 flex justify-center lg:justify-end relative">
          <div ref={imageContainerRef} className="relative w-full max-w-full sm:max-w-lg aspect-square overflow-hidden">
            <Ripple
              mainCircleSize={rippleSize}
              numCircles={5}
              className="absolute inset-0"
            />

            <div className="relative z-10 flex items-center justify-center w-full h-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={heroImage}
                alt="Product"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
