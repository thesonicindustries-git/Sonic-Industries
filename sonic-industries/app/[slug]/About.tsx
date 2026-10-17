"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimationGeneratorType } from "framer-motion";
import {
  ShieldCheck,
  Cog,
  Touchpad,
  Video,
  Truck,
  RefreshCw,
  Wallet,
  BadgeIndianRupee,
} from "lucide-react";
import { Feature, FeatureCardProps } from "@/types";

export default function About() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );

    const currentSection = sectionRef.current;
    if (currentSection) observer.observe(currentSection);

    return () => {
      if (currentSection) observer.unobserve(currentSection);
    };
  }, []);

  const features: Feature[] = [
    {
      title: "1 Year Warranty",
      icon: <ShieldCheck className="w-12 h-12" />,
      description:
        "Enjoy peace of mind with a full 1-year warranty covering manufacturing defects and service support.",
      animation: "left",
    },
    {
      title: "Maintenance Free Machinery",
      icon: <Cog className="w-12 h-12" />,
      description:
        "Our machinery is designed for long-term durability and operates smoothly with minimal maintenance.",
      animation: "bottom",
    },
    {
      title: "Easy Operation",
      icon: <Touchpad className="w-12 h-12" />,
      description:
        "User-friendly controls and intuitive functionality make operating our products effortless for anyone.",
      animation: "bottom",
    },
    {
      title: "Video Call Assistance",
      icon: <Video className="w-12 h-12" />,
      description:
        "Get instant expert help through video call assistance whenever you need guidance or troubleshooting.",
      animation: "right",
    },
    {
      title: "All Over India Delivery",
      icon: <Truck className="w-12 h-12" />,
      description:
        "We deliver safely and quickly to every corner of India, ensuring fast and reliable shipping.",
      animation: "left",
    },
    {
      title: "7 Days Replacement",
      icon: <RefreshCw className="w-12 h-12" />,
      description:
        "If you face any product issues, enjoy a hassle-free 7-day replacement guarantee.",
      animation: "bottom",
    },
    {
      title: "Cash On Delivery",
      icon: <Wallet className="w-12 h-12" />,
      description:
        "Make secure purchases with the convenience of cash on delivery available for eligible locations.",
      animation: "bottom",
    },
    {
      title: "Affordable Price",
      icon: <BadgeIndianRupee className="w-12 h-12" />,
      description:
        "We offer high-quality products at the most competitive and affordable prices in the market.",
      animation: "right",
    },
  ];

  const getAnimationVariant = (direction: "left" | "right" | "bottom") => {
    switch (direction) {
      case "left":
        return {
          hidden: { x: -80, opacity: 0 },
          visible: {
            x: 0,
            opacity: 1,
            transition: {
              type: "spring" as AnimationGeneratorType,
              stiffness: 100,
              damping: 12,
              duration: 0.8,
            },
          },
        };
      case "right":
        return {
          hidden: { x: 80, opacity: 0 },
          visible: {
            x: 0,
            opacity: 1,
            transition: {
              type: "spring" as AnimationGeneratorType,
              stiffness: 100,
              damping: 12,
              duration: 0.8,
            },
          },
        };
      case "bottom":
        return {
          hidden: { y: 80, opacity: 0 },
          visible: {
            y: 0,
            opacity: 1,
            transition: {
              type: "spring" as AnimationGeneratorType,
              stiffness: 80,
              damping: 12,
              duration: 0.8,
            },
          },
        };
      default:
        return {
          hidden: { scale: 0.9, opacity: 0 },
          visible: {
            scale: 1,
            opacity: 1,
            transition: {
              type: "spring" as AnimationGeneratorType,
              stiffness: 100,
              damping: 10,
              duration: 0.7,
            },
          },
        };
    }
  };

  const FeatureCard: React.FC<FeatureCardProps> = ({ feature, index }) => {
    const [isHovered, setIsHovered] = useState(false);

    const cardVariants = {
      hover: {
        y: -10,
        boxShadow:
          "0 20px 25px -5px rgba(0,0,0,0.1),0 10px 10px -5px rgba(0,0,0,0.04)",
        transition: {
          type: "spring" as AnimationGeneratorType,
          stiffness: 300,
          damping: 20,
        },
      },
    };

    const iconVariants = {
      initial: { rotate: 0, scale: 1 },
      hover: {
        rotate: [0, -10, 10, -5, 5, 0],
        scale: 1.2,
        transition: {
          rotate: { duration: 0.5, times: [0, 0.2, 0.4, 0.6, 0.8, 1] },
          scale: { duration: 0.3 },
        },
      },
    };

    return (
      <motion.div
        initial="hidden"
        animate={isVisible ? "visible" : "hidden"}
        whileHover="hover"
        variants={{
          ...getAnimationVariant(feature.animation),
          ...cardVariants,
        }}
        transition={{ delay: index * 0.1 }}
        className="relative w-full overflow-hidden rounded-2xl bg-white shadow-lg h-auto sm:w-[calc(50%-1rem)] sm:h-96 md:w-[calc(33.333%-1.333rem)] lg:w-[calc(25%-1.5rem)] flex"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className={`p-5 sm:p-6 md:p-8 relative z-10 flex flex-col justify-between h-full ${
            isHovered ? "text-white" : "text-gray-800"
          }`}
        >
          <motion.div
            className="flex justify-center mb-4 sm:mb-6"
            variants={iconVariants}
            initial="initial"
            animate={isHovered ? "hover" : "initial"}
          >
            <div
              className={`text-4xl md:text-5xl lg:text-6xl xl:text-7xl ${
                isHovered ? "text-white" : "text-red-600"
              }`}
            >
              {feature.icon}
            </div>
          </motion.div>
          <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-center mb-3 sm:mb-4 leading-snug">
            {feature.title}
          </h3>
          <p
            className={`text-sm sm:text-base text-center leading-relaxed ${
              isHovered ? "text-white" : "text-gray-600"
            }`}
          >
            {feature.description}
          </p>
        </div>
        {/* Background glow */}
        <motion.div
          className="absolute inset-0 bg-linear-to-tr from-orange-700 to-red-500 rounded-2xl z-0"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: isHovered ? 1 : 0, opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.4 }}
          style={{ originX: 0.5, originY: 0.5 }}
        />
      </motion.div>
    );
  };

  return (
    <div
      className="min-h-screen bg-white py-16 sm:py-20"
      ref={sectionRef}
      id="about"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 sm:mb-20">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
            Why Sonic Industries Is Best
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Sonic Industries is a trusted leader in packaging solutions,
            delivering innovation, precision, and reliability across industries.
            Our commitment to quality, efficiency, and customer satisfaction
            makes us the preferred choice for businesses worldwide.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-6 sm:gap-8 cursor-pointer">
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
