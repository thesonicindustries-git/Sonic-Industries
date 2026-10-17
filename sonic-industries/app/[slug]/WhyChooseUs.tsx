"use client";

import { useState, useEffect, useRef } from "react";
import { Play, RotateCw, Truck, RefreshCw, Headphones, X } from "lucide-react";
import { CategoryBackend, CategoryImages, ProductBackend } from "@/types";
import Image from "next/image";
import { getResolvedVideoData } from "@/lib/getVideoData";

interface WhyChooseUsProps {
  productData: ProductBackend | null;
  allProductData: CategoryImages | null;
}

export default function WhyChooseUs({
  productData,
  allProductData,
}: WhyChooseUsProps) {
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Animation on view
  useEffect(() => {
    const currentSection = sectionRef.current;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.2 }
    );

    if (currentSection) {
      observer.observe(currentSection);
    }

    return () => {
      if (currentSection) {
        observer.unobserve(currentSection);
      }
    };
  }, []);

  // Animation on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (sectionRef.current) {
        const rect = sectionRef.current.getBoundingClientRect();
        const windowHeight = window.innerHeight;

        // Calculate how far through the section we've scrolled (0 to 1)
        const progress = 1 - rect.bottom / (windowHeight + rect.height);
        setScrollProgress(Math.max(0, Math.min(1, progress)));
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        setIsVideoModalOpen(false);
      }
    };

    if (isVideoModalOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isVideoModalOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isVideoModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isVideoModalOpen]);

  function getYouTubeEmbedURL(url: string): string | null {
    const match = url.match(
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([^\s&?]+)/
    );
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  }

  function getYouTubeThumbnail(url: string): string | null {
    const match = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^\s&?]+)/
    );
    const videoId = match?.[1];
    return videoId
      ? `https://img.youtube.com/vi/${videoId}/sddefault.jpg`
      : null;
  }

  const videoData = getResolvedVideoData(productData, allProductData);

  if (!videoData?.yt_video_url) return null; // ❗ No video → no section

  const videoURL = videoData.yt_video_url;

  return (
    <div
      ref={sectionRef}
      className="w-full max-w-7xl mx-auto px-6 py-16 overflow-hidden"
    >
      <div
        className={`transform transition-all duration-1000 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
        }`}
      >
        <h1 className="text-4xl md:text-5xl font-bold text-center text-black bg-clip-text mb-3">
          Why Choose Us
        </h1>

        <p className="text-center text-gray-600 mb-10 max-w-2xl mx-auto text-lg">
          Experience excellence in every detail. We combine innovation with
          reliability to deliver products that exceed expectations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
        <div
          className={`lg:col-span-7 rounded-3xl overflow-hidden shadow-2xl relative bg-linear-to-r from-indigo-500 to-purple-600 transform transition-all duration-1000 ease-out h-full`}
          style={{
            transformOrigin: "left center",
            transform: isVisible
              ? `translateX(${scrollProgress * 20}px) scale(${
                  1 - scrollProgress * 0.05
                })`
              : "translateX(-100px) scale(0.95)",
            opacity: isVisible ? 1 : 0,
          }}
        >
          <div className="relative w-full h-55 sm:h-70 md:h-90 lg:h-full group">
            {/* Video placeholder */}
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden cursor-pointer">
              <Image
                src={
                  getYouTubeThumbnail(videoURL || "") || "/opengraph-image.png"
                }
                alt="Product showcase video thumbnail"
                className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105"
                width={1280}
                height={720}
              />

              {/* Gradient overlay - full blue gradient to match second image */}
              <div className="absolute inset-0 bg-linear-to-b from-transparent via-blue-500/5 to-blue-600/20"></div>

              {/* Play button */}
              <button
                onClick={() => setIsVideoModalOpen(true)}
                className="absolute rounded-full bg-white w-16 h-16 md:w-20 md:h-20 flex items-center justify-center shadow-xl hover:bg-opacity-90 transition-all duration-300 hover:scale-110 z-10 group cursor-pointer"
              >
                <div className="absolute inset-0 rounded-full bg-white opacity-20 animate-ping"></div>
                <Play
                  size={32}
                  fill="#4f46e5"
                  className="text-indigo-600 ml-1"
                />
                <span className="absolute -bottom-14 text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Watch Video
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Bento Grid Features */}
        <div className="lg:col-span-5 grid grid-cols-6 grid-rows-6 gap-4 h-full">
          {/* 1 Year Guarantee - Top Right */}
          <div
            className="col-span-6 row-span-3 bg-gray-600 rounded-3xl p-6 flex flex-col items-center justify-center shadow-lg transform transition-all duration-500 hover:scale-105 hover:shadow-xl cursor-pointer"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? "translateY(0)" : "translateY(20px)",
              transitionDelay: "0.2s",
            }}
          >
            <div className="relative w-16 h-16 mb-4">
              <div
                className="absolute inset-0 border-2 border-dashed border-white/60 rounded-full animate-spin"
                style={{ animationDuration: "10s" }}
              ></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <RotateCw size={28} className="text-white" />
              </div>
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-white">
              1 Year Guarantee
            </h3>
          </div>

          {/* Free Shipping - Middle Left */}
          <div
            className="col-span-3 row-span-3 bg-white rounded-3xl p-4 flex flex-col items-center justify-center text-gray-800 shadow-lg transform transition-all duration-500 hover:scale-105 hover:shadow-xl cursor-pointer"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? "translateY(0)" : "translateY(20px)",
              transitionDelay: "0.2s",
            }}
          >
            <div className="relative w-14 h-14 mb-3">
              <div
                className="absolute inset-0 border-2 border-dashed border-gray-400 rounded-full animate-spin"
                style={{ animationDuration: "12s" }}
              ></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Truck size={22} className="text-black-500" />
              </div>
            </div>
            <h3 className="text-lg md:text-xl font-bold text-center">
              Free Shipping
            </h3>
          </div>

          {/* Product Return - Middle Right */}
          <div
            className="col-span-3 row-span-3 bg-white rounded-3xl p-4 flex flex-col items-center justify-center text-gray-800 shadow-lg transform transition-all duration-500 hover:scale-105 hover:shadow-xl cursor-pointer"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? "translateY(0)" : "translateY(20px)",
              transitionDelay: "0.2s",
            }}
          >
            <div className="relative w-14 h-14 mb-3">
              <div
                className="absolute inset-0 border-2 border-dashed border-gray-400 rounded-full animate-spin"
                style={{ animationDuration: "8s" }}
              ></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <RefreshCw size={22} className="text-black-500" />
              </div>
            </div>
            <h3 className="text-lg md:text-xl font-bold text-center">
              Product Return
            </h3>
          </div>

          {/* Dedicated Support - Bottom */}
          <div
            className="col-span-6 row-span-3 bg-pink-400 rounded-3xl p-6 flex flex-col items-center justify-center text-white shadow-lg transform transition-all duration-500 hover:scale-105 hover:shadow-xl cursor-pointer"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? "translateY(0)" : "translateY(20px)",
              transitionDelay: "0.2s",
            }}
          >
            <div className="relative w-16 h-16 mb-4">
              <div
                className="absolute inset-0 border-2 border-dashed border-white/60 rounded-full animate-spin"
                style={{ animationDuration: "15s" }}
              ></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Headphones size={28} className="text-white" />
              </div>
            </div>
            <h3 className="text-xl md:text-2xl font-bold">Dedicated Support</h3>
          </div>
        </div>
      </div>

      {/* Video Modal */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div
            ref={modalRef}
            className="bg-black rounded-lg overflow-hidden shadow-xl w-full max-w-full md:max-w-4xl transform transition-all duration-300"
          >
            <div className="aspect-video w-full">
              <iframe
                width="100%"
                height="100%"
                src={getYouTubeEmbedURL(videoURL || "") || ""}
                title="Product Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              ></iframe>
              <div className="p-3 text-center bg-black">
                <a
                  href={videoURL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-400 hover:text-blue-300 underline"
                >
                  Open in YouTube
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Background elements */}
      <div className="fixed top-1/2 right-1/2 w-full h-full -z-10 overflow-hidden opacity-20 pointer-events-none">
        <div
          className="absolute w-64 h-64 rounded-full bg-linear-to-r from-blue-400 to-purple-500 blur-3xl"
          style={{
            transform: `scale(${0.5 + scrollProgress * 1.5}) translate(${
              scrollProgress * 100
            }px, ${-scrollProgress * 50}px)`,
            opacity: 0.1 + scrollProgress * 0.3,
            transition: "transform 0.3s ease-out, opacity 0.3s ease-out",
          }}
        ></div>
      </div>

      {/* Add animation keyframes for modal */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }

        .animate-scaleIn {
          animation: scaleIn 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
