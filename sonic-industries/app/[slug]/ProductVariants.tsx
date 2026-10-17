"use client";

import { Star } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/app/ui/carousel";
import Image from "next/image";
import { CategoryBackend, ProductBackend } from "@/types";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

interface ProductVariantsProps {
  productData: CategoryBackend | null;
}

export default function ProductVariants({ productData }: ProductVariantsProps) {
  const [products, setProducts] = useState<ProductBackend[]>([]);
  const router = useRouter();

  const handleBuyNow = async ({ productId }: { productId: string }) => {
    try {
      const SessionTokenRes = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/payment/checkout`,
        { productId }
      );

      const { checkoutSessionToken } = SessionTokenRes.data;
      router.push(`/checkout?token=${checkoutSessionToken}`);
    } catch (error) {
      console.error("Error initiating checkout:", error);
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const products = await axios.post(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/products/getProducts`,
          {
            categoryId: productData?._id,
          }
        );
        setProducts(products.data.products);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    fetchProducts();
  }, [productData?._id]);

  // Helper function to render stars
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star key={i} className="text-yellow-500 fill-yellow-500" size={20} />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <div key={i} className="relative">
            <Star className="text-gray-300 fill-gray-300" size={20} />
            <div className="absolute top-0 left-0 overflow-hidden w-1/2">
              <Star className="text-yellow-500 fill-yellow-500" size={20} />
            </div>
          </div>
        );
      } else {
        stars.push(
          <Star key={i} className="text-gray-300 fill-gray-300" size={20} />
        );
      }
    }

    return stars;
  };

  return (
    <div
      className="bg-white min-h-screen flex items-center justify-center px-4 py-8"
      id="products"
    >
      <div className="max-w-6xl mx-auto w-full">
        {/* Header Section */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-2 sm:mb-4">
            Our Awesome Products
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto text-sm sm:text-base md:text-lg">
            Explore every product in this category, designed to meet your needs
            and expectations.
          </p>
        </div>

        {/* Products Carousel */}
        <Carousel className="w-full">
          <CarouselContent
            className={`flex gap-4 sm:gap-6 md:gap-8 ${
              products.length === 1 ? "justify-center" : "justify-start"
            }`}
          >
            {products.map((product) => (
              <CarouselItem
                key={product._id}
                className="flex justify-center md:basis-1/2 lg:basis-1/4"
              >
                <div className="relative group overflow-hidden cursor-pointer">
                  {/* Product Image with Background */}
                  <div className="bg-gray-100 p-4 rounded-t-lg relative overflow-hidden h-64 flex items-center justify-center">
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      className="mx-auto transition-transform duration-300 group-hover:scale-105 z-10"
                      width={500}
                      height={500}
                    />

                    <div className="absolute inset-0 flex items-center justify-center z-20 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
                      <button
                        className="py-3 px-8 bg-red-600 text-white font-bold text-lg rounded hover:bg-red-700 cursor-pointer scale-100 md:scale-0 md:group-hover:scale-100 transition-transform duration-300"
                        onClick={() => handleBuyNow({ productId: product._id })}
                      >
                        BUY NOW
                      </button>
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="bg-gray-100 p-4 rounded-b-lg">
                    {/* Rating */}
                    <div className="flex items-center mb-2">
                      {renderStars(product.rating || 5)}
                    </div>

                    {/* Price */}
                    <div className="flex items-center mb-2">
                      <span className="text-xl font-bold text-black-600 mr-2">
                        ₹{product.price}
                      </span>
                    </div>

                    {/* Product Name */}
                    <h3 className="text-lg font-semibold text-gray-800">
                      {product.name}
                    </h3>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="flex justify-center mt-8">
            <CarouselPrevious className="static transform-none mx-2 cursor-pointer" />
            <CarouselNext className="static transform-none mx-2 cursor-pointer" />
          </div>
        </Carousel>
      </div>
    </div>
  );
}
