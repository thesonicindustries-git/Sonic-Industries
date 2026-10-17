"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence, easeOut } from "framer-motion";
import { CategoryImages, FAQItem } from "@/types";

interface FAQsProps {
  allProductData: CategoryImages;
}

export default function FAQs({ allProductData }: FAQsProps) {
  const [openItem, setOpenItem] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  const faqItems: FAQItem[] = [
    {
      id: 1,
      question: "What products does Sonic Industries offer ?",
      answer:
        "We provide a wide range of packaging machinery, coding and printing solutions, and automation systems for industries like FMCG, pharma, food & beverage, and electronics.",
    },
    {
      id: 2,
      question: "Are Sonic machines easy to operate ?",
      answer:
        "Yes! Our equipment features user-friendly interfaces, touchscreen controls, and ergonomic designs to simplify operation and reduce training time.",
    },
    {
      id: 3,
      question: "Can Sonic machines work with different packaging materials ?",
      answer:
        "Absolutely. Our systems are designed to handle cartons, pouches, plastics, metals, and other surfaces efficiently.",
    },
    {
      id: 4,
      question: "Do you provide installation and training ?",
      answer:
        "Yes. Sonic Industries offers complete installation, setup, and operator training to ensure smooth implementation.",
    },
    {
      id: 5,
      question: "What kind of after-sales support do you provide ?",
      answer:
        "We offer 24/7 technical support, maintenance guidance, and spare parts supply to keep your operations running smoothly.",
    },
    {
      id: 6,
      question: "Are Sonic machines durable and reliable ?",
      answer:
        "Our equipment is built for industrial-grade performance, ensuring durability, precision, and long-term reliability even in tough production environments.",
    },
    {
      id: 7,
      question: "Can Sonic customize solutions for specific needs ?",
      answer:
        "Yes. We provide tailored solutions to meet your production, coding, and packaging requirements.",
    },
    {
      id: 8,
      question: "How do Sonic machines improve productivity ?",
      answer:
        "By combining precision, speed, and automation, our machinery reduces downtime, minimizes errors, and maximizes throughput.",
    },
  ];

  const toggleAccordion = (id: number) => {
    setOpenItem((prev) => (prev === id ? null : id));
  };

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.2 },
    );
    const currentSection = sectionRef.current;
    if (currentSection) observer.observe(currentSection);
    return () => {
      if (currentSection) observer.unobserve(currentSection);
    };
  }, []);

  // Scroll progress
  useEffect(() => {
    const handleScroll = () => {
      if (sectionRef.current) {
        const rect = sectionRef.current.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const progress = 1 - rect.bottom / (windowHeight + rect.height);
        setScrollProgress(Math.max(0, Math.min(1, progress)));
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const backgroundVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: (i: number) => ({
      opacity: 0.05,
      scale: 1 + i * 0.5,
      x: i * 50,
      y: i * 30,
      transition: { duration: 0.8, ease: easeOut },
    }),
  };

  const faqContainerVariants = {
    hidden: { opacity: 0, x: -32 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { staggerChildren: 0.1, when: "beforeChildren" },
    },
  };

  const faqItemVariants = {
    hidden: { opacity: 0, x: -16 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
  };

  const imageContainerVariants = {
    hidden: { opacity: 0, x: 32, scale: 0.95 },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: { duration: 1, ease: easeOut, delay: 0.3 },
    },
  };

  const imageVariants = {
    hidden: { y: 20, scale: 0.9, rotate: 6 },
    visible: {
      y: 0,
      scale: 1.1,
      rotate: 0,
      transition: { duration: 1, ease: easeOut, delay: 0.3 },
    },
    hover: { scale: 1.15, transition: { duration: 0.3 } },
  };

  return (
    <div
      className="relative bg-gray-50 py-16 px-4 sm:px-6 md:py-20 overflow-hidden"
      ref={sectionRef}
      id="faq"
    >
      {/* Background decoration */}
      <motion.div
        className="absolute -top-32 -left-32 w-64 h-64 rounded-full bg-red-500 blur-3xl pointer-events-none"
        initial="hidden"
        animate={isVisible ? "visible" : "hidden"}
        variants={backgroundVariants}
        custom={scrollProgress}
      />
      <motion.div
        className="absolute bottom-0 right-0 w-72 h-72 rounded-full bg-red-500 blur-3xl pointer-events-none"
        initial="hidden"
        animate={isVisible ? "visible" : "hidden"}
        variants={backgroundVariants}
        custom={scrollProgress * 0.8}
      />

      <div className="w-full max-w-none mx-auto">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-3">
          Asked Questions
        </h2>
        <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto mb-5">
          Find answers to commonly asked questions about our products, ordering
          process, payment options, and more to help you make informed
          decisions.
        </p>

        <div className="w-full">
          {/* Accordion */}
          <motion.div
            className="w-full space-y-4"
            initial="hidden"
            animate={isVisible ? "visible" : "hidden"}
            variants={faqContainerVariants}
          >
            {faqItems.map((item) => (
              <motion.div
                key={item.id}
                className="bg-white rounded-lg shadow-md overflow-hidden"
                variants={faqItemVariants}
                style={{
                  borderLeft:
                    openItem === item.id
                      ? "4px solid #8b5cf6"
                      : "4px solid transparent",
                }}
              >
                <button
                  onClick={() => toggleAccordion(item.id)}
                  className="w-full flex justify-between items-center p-4 sm:p-5 text-left hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <h3 className="font-medium text-gray-800 text-sm sm:text-base md:text-sm lg:text-xl">
                    {item.question}
                  </h3>
                  <motion.div
                    animate={{ rotate: openItem === item.id ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {openItem === item.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="p-3 sm:p-4 md:p-5 lg:p-6 bg-gray-50 text-gray-600 text-xs sm:text-sm md:text-sm lg:text-lg border-t border-gray-100">
                        {item.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
