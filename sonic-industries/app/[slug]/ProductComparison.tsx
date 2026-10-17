"use client";

import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CategoryImages } from "@/types";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface ProductComparisonProps {
  allProductData: CategoryImages;
}

export default function ProductComparison({
  allProductData,
}: ProductComparisonProps) {
  const products = allProductData.products || [];
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);

  // -----------------------------
  // UNIQUE FEATURES
  // -----------------------------
  const uniqueFeatures = Array.from(
    new Set(products.flatMap((p) => p.features?.map((f) => f.name) || []))
  );

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  /* =========================================================
     MOBILE / TABLET VIEW → PRODUCT CARDS
     ========================================================= */
  /* =========================================================
   COMPACT MOBILE VIEW
   ========================================================= */
  if (isMobile) {
    return (
      <section className="max-w-6xl mx-auto px-3 py-6">
        <h1 className="text-xl font-extrabold text-center mb-4">
          Compare Products
        </h1>

        <div className="space-y-3">
          {products.map((product) => (
            <motion.div
              key={product._id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-xl shadow p-3"
            >
              {/* Header */}
              <div className="flex items-center gap-3">
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  width={80}
                  height={80}
                  className="w-14 h-14 object-contain"
                />

                <div className="flex-1">
                  <h2 className="font-bold text-sm leading-tight">
                    {product.name}
                  </h2>
                  <p className="text-gray-600 font-extrabold text-sm">
                    ₹{product.price}
                  </p>
                </div>

                <details className="group">
                  <summary className="cursor-pointer text-xs text-gray-600 font-semibold">
                    Specs
                  </summary>

                  <div className="absolute right-3 mt-2 w-64 bg-white rounded-lg shadow-lg p-3 text-xs z-20">
                    <div className="divide-y">
                      {uniqueFeatures.map((feature) => {
                        const match = product.features?.find(
                          (f) => f.name === feature
                        );
                        return (
                          <div
                            key={feature}
                            className="flex justify-between py-1"
                          >
                            <span className="text-gray-600">{feature}</span>
                            <span className="font-semibold">
                              {match ? match.weight : "--"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </details>
              </div>

              {/* CTA */}
              <button
                className="mt-2 w-full bg-red-600 text-white text-xs font-bold py-1.5 rounded-lg hover:bg-red-700 transition cursor-pointer"
                onClick={() => router.push(`/${product.slug}`)}
              >
                LEARN MORE
              </button>
            </motion.div>
          ))}
        </div>
      </section>
    );
  }

  /* =========================================================
     DESKTOP VIEW → COMPARISON TABLE
     ========================================================= */
  return (
    <motion.section
      className="max-w-7xl mx-auto px-4 py-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <h1 className="text-3xl lg:text-4xl font-extrabold text-center mb-10">
        Compare Products
      </h1>

      <div className="overflow-x-auto rounded-xl shadow-xl">
        <table className="w-full border-collapse bg-white text-sm lg:text-base">
          <thead>
            <tr>
              <th className="sticky left-0 bg-gray-50 z-10 p-4"></th>
              {products.map((product) => (
                <th key={product._id} className="min-w-55 p-4 border-b">
                  <div className="flex flex-col items-center">
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      width={140}
                      height={140}
                      className="w-24 h-24 lg:w-28 lg:h-28 object-contain mb-2"
                    />
                    <h3 className="font-bold text-center text-sm lg:text-base">
                      {product.name}
                    </h3>
                    <p className="text-gray-600 font-extrabold mt-1">
                      ₹{product.price}
                    </p>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {uniqueFeatures.map((feature, index) => (
              <motion.tr
                key={feature}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.03 }}
                className={index % 2 === 0 ? "bg-gray-50/60" : ""}
              >
                <td className="sticky left-0 bg-white z-10 font-semibold p-4 border">
                  {feature}
                </td>

                {products.map((product) => {
                  const match = product.features?.find(
                    (f) => f.name === feature
                  );
                  return (
                    <td key={product._id} className="p-4 text-center border">
                      {match ? match.weight : "--"}
                    </td>
                  );
                })}
              </motion.tr>
            ))}

            <tr>
              <td className="sticky left-0 bg-gray-50 z-10 p-4"></td>
              {products.map((product) => (
                <td key={product._id} className="p-4">
                  <button
                    className="w-full bg-red-600 text-white font-bold py-2 rounded-lg hover:bg-red-700 transition cursor-pointer"
                    onClick={() => router.push(`/${product.slug}`)}
                  >
                    LEARN MORE
                  </button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </motion.section>
  );
}
