"use client";

import { DealBackend } from "@/types";
import axios from "axios";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function DealsOfWeek() {
  const [currentDeal, setCurrentDeal] = useState(0);
  const [deals, setDeals] = useState<DealBackend[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDeals = async () => {
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/deals`,
      );
      setDeals(res.data.deals);
    } catch (error) {
      console.error("Error fetching deals:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  const nextDeal = useCallback(() => {
    setCurrentDeal((prev) => (prev + 1) % deals.length);
  }, [deals.length]);

  const prevDeal = useCallback(() => {
    setCurrentDeal((prev) => (prev - 1 + deals.length) % deals.length);
  }, [deals.length]);

  useEffect(() => {
    const interval = setInterval(nextDeal, 5000);
    return () => clearInterval(interval);
  }, [nextDeal]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-500">Loading deals...</p>
      </div>
    );
  }

  if (!loading && deals.length === 0) return null;

  const currentDealData = deals[currentDeal];

  const getTimeLeft = (expiresAt: Date) => {
    const now = new Date();
    const expire = new Date(expiresAt);
    const diff = expire.getTime() - now.getTime();
    if (diff <= 0)
      return { days: "00", hours: "00", minutes: "00", seconds: "00" };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    return {
      days: days.toString().padStart(2, "0"),
      hours: hours.toString().padStart(2, "0"),
      minutes: minutes.toString().padStart(2, "0"),
      seconds: seconds.toString().padStart(2, "0"),
    };
  };

  const timeLeft = getTimeLeft(currentDealData.expiresAt);

  return (
    <div className="bg-linear-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-2 sm:mb-4">
            Deals Of The Week
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto text-sm sm:text-base md:text-lg">
            Discover incredible savings on premium tech products. Limited time
            offers you don&apos;t want to miss!
          </p>
        </div>

        {/* Carousel */}
        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentDeal}
              initial={{ opacity: 0, x: 80 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -80 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-full sm:max-w-5xl mx-auto transition-all duration-500 transform hover:shadow-2xl"
            >
              <div className="flex flex-col md:flex-row">
                {/* Image */}
                <div className="md:w-1/2 p-4 sm:p-6 md:p-8 flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-50">
                  <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md">
                    <Image
                      alt={currentDealData.title || "Deal Image"}
                      className="w-full h-48 sm:h-64 md:h-80 object-contain transition-transform duration-300 hover:scale-105"
                      src={currentDealData.imageUrl || "/placeholder.png"}
                      width={500}
                      height={500}
                    />
                    {currentDealData.dealType === "product" ||
                    currentDealData.discountPercent ? (
                      <div className="absolute top-0 right-0 bg-red-500 text-white px-2 sm:px-3 py-1 rounded-bl-lg font-bold text-xs sm:text-sm">
                        {currentDealData.dealType === "product" &&
                        currentDealData.discountPercent
                          ? `${Math.round(currentDealData.discountPercent)}% OFF`
                          : "Limited Offer"}
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Details */}
                <div className="md:w-1/2 p-4 sm:p-6 md:p-8 flex flex-col justify-center">
                  <div className="flex items-center mb-2 sm:mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 sm:w-5 sm:h-5 ${
                          i < (currentDealData.rating ?? 0)
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-300"
                        }`}
                        aria-hidden="true"
                      />
                    ))}
                    <span className="ml-1 sm:ml-2 text-xs sm:text-sm text-gray-600">
                      ({currentDealData.rating ?? 0}.0)
                    </span>
                  </div>

                  {currentDealData.dealType === "product" ? (
                    <>
                      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-2 sm:mb-4">
                        {currentDealData.productName}
                      </h2>
                      <div className="flex items-center mb-4 sm:mb-6">
                        <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-red-600 mr-2 sm:mr-3">
                          ₹{currentDealData.discountedPrice.toFixed(2)}
                        </span>
                        {currentDealData.mrp && (
                          <span className="text-sm sm:text-base md:text-lg text-gray-500 line-through">
                            ₹{currentDealData.mrp}
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-2 sm:mb-4">
                        {currentDealData.title}
                      </h2>
                      <p className="text-gray-600 text-sm sm:text-base mb-4 sm:mb-6 leading-relaxed">
                        {currentDealData.description}
                      </p>
                      <div className="flex items-center mb-4 sm:mb-6">
                        <span className="text-xl sm:text-2xl md:text-3xl font-semibold text-orange-600">
                          Flat ₹{currentDealData.discountedPrice.toFixed(2)} off
                        </span>
                      </div>
                    </>
                  )}

                  {/* Countdown */}
                    <div className="mb-4 sm:mb-6">
                      <div className="flex items-center mb-2">
                        <p className="text-xs sm:text-sm text-gray-700 font-semibold mr-2">
                          Use Coupon:
                        </p>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(currentDealData.couponCode || "");
                            }}
                            className="text-orange-700 hover:text-orange-900 transition-colors"
                            title="Copy coupon code"
                            aria-label="Copy coupon code"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <rect x="8" y="8" width="14" height="14" rx="2" />
                              <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
                            </svg>
                          </button>

                          <p className="text-sm sm:text-base font-bold text-orange-700 tracking-wider">
                            {currentDealData.couponCode || "NO COUPON"}
                          </p>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-gray-600 mb-2 font-medium">
                        Deal expires in:
                      </p>

                      <div className="flex justify-between max-w-xs sm:max-w-sm gap-2">
                        {Object.entries(timeLeft).map(([key, value], index) => (
                          <div
                            key={index}
                            className="text-center p-2 sm:p-3 bg-linear-to-b from-gray-100 to-gray-200 rounded-lg shadow-inner min-w-12"
                          >
                            <div className="text-lg sm:text-xl font-bold text-gray-800">
                              {value}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-600 capitalize">
                              {key}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  <button
                    className="bg-linear-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-3 sm:py-4 px-4 sm:px-8 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg cursor-pointer text-sm sm:text-base md:text-lg"
                    onClick={async () => {
                      try {
                        const coupon = currentDealData.couponCode;

                        if (coupon) {
                          await navigator.clipboard.writeText(
                            currentDealData.couponCode,
                          );

                          toast.success(
                            `Coupon copied successfully: ${currentDealData.couponCode}`,
                          );

                          document.getElementById("products")?.scrollIntoView({
                            behavior: "smooth",
                          });
                        }
                      } catch (error) {
                        console.error("Internal Server Error: ", error);
                        toast.error("Coupon cannot be applied now");
                      }
                    }}
                  >
                    BUY NOW - LIMITED TIME!
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Arrows */}
          <button
            onClick={prevDeal}
            className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-white hover:bg-gray-50 text-gray-800 p-2 sm:p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-10"
            aria-label="Previous deal"
          >
            <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6" />
          </button>

          <button
            onClick={nextDeal}
            className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-white hover:bg-gray-50 text-gray-800 p-2 sm:p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-10"
            aria-label="Next deal"
          >
            <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Dots */}
        <div className="flex justify-center mt-6 space-x-2 sm:space-x-3">
          {deals.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentDeal(index)}
              className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full transition-all duration-300 ${
                index === currentDeal
                  ? "bg-gray-600 scale-125"
                  : "bg-gray-300 hover:bg-gray-400"
              }`}
              aria-label={`Go to deal ${index + 1}`}
            />
          ))}
        </div>

        <div className="text-center mt-4 sm:mt-6">
          <p className="text-gray-600 text-xs sm:text-sm">
            Deal {currentDeal + 1} of {deals.length}
          </p>
        </div>
      </div>
    </div>
  );
}
