"use client";

import { useState, useEffect, ComponentType } from "react";
import { motion } from "framer-motion";
import {
  CategoryBackend,
  CategoryImages,
  FeaturesBlock,
  ProductBackend,
} from "@/types";
import * as LucideIcons from "lucide-react";

interface ProductIntroProps {
  productData: CategoryBackend | ProductBackend;
  parentCategoryData: CategoryBackend | null;
  allProductData: CategoryImages;
}

export default function ProductIntro({
  productData,
  parentCategoryData,
  allProductData,
}: ProductIntroProps) {
  const [, setScrollPosition] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollPosition(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function isCategory(
    data: CategoryBackend | ProductBackend
  ): data is CategoryBackend {
    return "title" in data;
  }

  const emptyFeatures: FeaturesBlock = {
    desc1: "",
    desc2: "",
    items: [],
  };

  let features: FeaturesBlock = emptyFeatures;

  if (productData) {
    if (isCategory(productData)) {
      // 1️⃣ Category → productData first, then parent category
      features = productData.features?.items?.length
        ? productData.features
        : parentCategoryData?.features?.items?.length
        ? parentCategoryData.features
        : emptyFeatures;
    } else {
      // 2️⃣ Product → product characteristics first, then parent category
      features = productData.characteristics?.items?.length
        ? productData.characteristics
        : parentCategoryData?.features?.items?.length
        ? parentCategoryData.features
        : emptyFeatures;
    }
  } else {
    // 3️⃣ productData missing → parent category fallback
    features = parentCategoryData?.features?.items?.length
      ? parentCategoryData.features
      : emptyFeatures;
  }

  const intro1 = isCategory(productData)
    ? allProductData.images?.[2] // category → any product image
    : productData.images?.[1];

  return (
    <div
      className="min-h-screen bg-white relative overflow-hidden"
      id="features"
    >
      <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-linear-to-r from-indigo-100 via-purple-100 to-pink-100 pointer-events-none" />

      <div className="container mx-auto px-6 py-16 md:py-28 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-12">
          <motion.div
            className="w-full md:w-1/2 flex justify-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <motion.img
              src={intro1}
              alt="Product Image"
              className="w-full md:w-5/6 lg:w-3/4"
              animate={{ y: [0, -10, 0] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "loop",
                ease: "easeInOut",
              }}
            />
          </motion.div>

          {/* Text and Features */}
          <div className="w-full md:w-1/2">
            <motion.h1
              className="text-2xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-gray-900 mb-10 leading-snug"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {features?.desc1 || "Product Features"}
            </motion.h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {features?.items?.slice(0, 4).map((feature, index) => {
                const IconComponent =
                  LucideIcons[feature.image as keyof typeof LucideIcons];

                const SafeIcon =
                  IconComponent as ComponentType<LucideIcons.LucideProps>;

                return (
                  <motion.div
                    key={index}
                    className="p-4 rounded-lg bg-white hover:shadow-xl transition-shadow duration-300 cursor-pointer"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                  >
                    <div className="flex items-center mb-4">
                      <div className="p-2 flex items-center justify-center">
                        {SafeIcon && (
                          <SafeIcon className="w-12 h-12 text-red-500" />
                        )}
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800">
                      {feature.name}
                    </h3>
                    <p className="text-gray-600 text-sm mt-2">{feature.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
