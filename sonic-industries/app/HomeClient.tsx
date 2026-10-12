

"use client";

import { useState, useEffect, useRef } from "react";

import Image from "next/image";

import Link from "next/link";

import { motion } from "framer-motion";

import { FaWhatsapp } from "react-icons/fa";

import {

  Phone,

  PhoneCall,

  Mail,

  MapPin,

  Menu,

  X,

  ArrowLeft,

  ArrowRight,

  Package,

  Cog,

  Truck,

  ShieldCheck,

  Facebook,

  Instagram,

  Youtube,

  Linkedin,

} from "lucide-react";

import { CategoryBackend } from "@/types";

const bannerSlides = [
  {
    image: "/m1.png",
    heading: "SMART MRP CODING CLEAR BATCH PRINTING",
    description:
      "Print MRP, date, batch codes, and variable data with a reliable handheld printer built for fast, clear industrial coding.",
    buttonText: "Explore Products",
    buttonLink: "/handheld-thermal-inkjet-printer",
  },
  {
    image: "/m2.png",
    heading: "SMARTER PACKAGING SEAMLESS AUTOMATION",
    description:
      "Seal pouches with speed, consistency, and a clean finish using a dependable band sealer built for daily packaging operations.",
    buttonText: "Explore Products",
    buttonLink: "/automatic-packaging-machine",
  },
  {
    image: "/m3.png",
    heading: "PROFESSIONAL CONTINUOUS BAND SEALING PERFORMANCE",
    description:
      "Discover reliable industrial solutions designed for performance, precision, and durability.",
    buttonText: "Explore Products",
    buttonLink: "/horizontal-band-sealing-machine",
  },
];

type Props = {

  categories: CategoryBackend[];

  categoryImages: Record<string, string | null>;

};

const contactButtonVariants = {

  initial: { scale: 0, opacity: 0 },

  animate: {

    scale: 1,

    opacity: 1,

    transition: { type: "spring" as const, stiffness: 300, damping: 15 },

  },

  hover: {

    scale: 1.1,

    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",

  },

};


const customCategoryOrder = [
  "handheld-thermal-inkjet-printer",
  "mini-inkjet-printer",
  "horizontal-band-sealing-machine",
  "vertical-band-sealing-machine",
  "nitrogen-flushing-band-sealer-horizontal",
  "nitrogen-flushing-band-sealer-vertical",
  "induction-sealing-machine",
  "paste-filling-machine",
  "automatic-packaging-machine",
  "granule-filling-machine",
];




export default function HomeClient({ categories, categoryImages }: Props) {
  const [showAllProducts, setShowAllProducts] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);

  const [slide, setSlide] = useState(0);
  const [slideDirection, setSlideDirection] = useState<1 | -1>(1);
  const dragStart = useRef<{ x: number; y: number } | null>(null);

  const handleCarouselPointerDown = (
    event: React.PointerEvent<HTMLElement>,
  ) => {
    dragStart.current = { x: event.clientX, y: event.clientY };
  };

  const handleCarouselPointerUp = (event: React.PointerEvent<HTMLElement>) => {
    if (!dragStart.current) return;

    const deltaX = event.clientX - dragStart.current.x;
    const deltaY = event.clientY - dragStart.current.y;
    dragStart.current = null;

    if (Math.abs(deltaX) < 48 || Math.abs(deltaX) <= Math.abs(deltaY)) return;

    setSlideDirection(deltaX > 0 ? -1 : 1);
    setSlide((current) =>
      (current + (deltaX > 0 ? -1 : 1) + bannerSlides.length) % bannerSlides.length,
    );
  };

useEffect(() => {
    const interval = setInterval(() => {
      setSlideDirection(1);
      setSlide((current) => (current + 1) % bannerSlides.length);
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  const features = [

    {

      icon: <Package className="w-8 h-8" />,

      title: "Packaging Solutions",

      description: "Advanced machinery for all your packaging needs",

    },

    {

      icon: <Cog className="w-8 h-8" />,

      title: "Maintenance Free",

      description: "Durable equipment requiring minimal upkeep",

    },

    {

      icon: <Truck className="w-8 h-8" />,

      title: "Pan India Delivery",

      description: "Fast and reliable shipping across India",

    },

    {

      icon: <ShieldCheck className="w-8 h-8" />,

      title: "1 Year Warranty",

      description: "Complete peace of mind with full warranty",

    },

  ];

  const orderedCategories = [
  ...customCategoryOrder
    .map((slug) => categories.find((category) => category.slug === slug))
    .filter((category) => category !== undefined),

  ...categories.filter(
    (category) => !customCategoryOrder.includes(category.slug),
  ),
];

  return (

    <div className="min-h-screen overflow-x-hidden bg-white pt-16">

      <div className="fixed right-3 bottom-4 sm:right-4 sm:bottom-6 z-50 flex flex-col gap-3 sm:gap-4">

        <motion.a

          href="tel:+918010735898"

          className="w-12 h-12 bg-green-700 rounded-full text-white flex items-center justify-center shadow-lg"

          initial="initial"

          animate="animate"

          whileHover="hover"

          variants={contactButtonVariants}

          aria-label="Call"

        >

          <PhoneCall size={22} />

        </motion.a>

        <motion.a

          href="https://wa.me/+918010735898"

          target="_blank"

          rel="noopener noreferrer"

          className="w-12 h-12 bg-[#25D366] rounded-full text-white flex items-center justify-center shadow-lg"

          initial="initial"

          animate="animate"

          whileHover="hover"

          variants={contactButtonVariants}

          aria-label="WhatsApp"

        >

          <FaWhatsapp size={22} />

        </motion.a>

      </div>

      {/* Navigation */}

      <nav className="fixed top-0 left-0 z-50 w-full bg-white shadow-sm">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex justify-between items-center h-16">

            <div className="flex items-center min-w-0">

              <div className="w-8 h-10 sm:w-10 sm:h-12 relative mr-2 shrink-0">

                <Image

                  src="/Sonic Logo.png"

                  alt="Sonic Industries Logo"

                  width={40}

                  height={48}

                  className="w-8 h-10 sm:w-10 sm:h-12"

                />

              </div>

              <div className="text-base sm:text-xl font-bold leading-tight">

                <div className="text-gray-800">SONIC</div>

                <div className="text-gray-800">INDUSTRIES</div>

              </div>

            </div>

            <div className="hidden md:flex space-x-6">

              <a

                href="#products"

                className="text-gray-700 hover:text-purple-600 transition"

              >

                Products

              </a>

              <a

                href="#about"

                className="text-gray-700 hover:text-purple-600 transition"

              >

                About

              </a>

              <a

                href="#contact"

                className="text-gray-700 hover:text-purple-600 transition"

              >

                Contact

              </a>

            </div>

            <button

              type="button"

              className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg text-gray-800"

              aria-label={menuOpen ? "Close menu" : "Open menu"}

              aria-expanded={menuOpen}

              onClick={() => setMenuOpen((open) => !open)}

            >

              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}

            </button>

          </div>

          {menuOpen && (

            <div className="md:hidden border-t border-gray-100 py-3 flex flex-col">

              <a

                href="#products"

                className="px-2 py-3 text-gray-700 hover:text-purple-600"

                onClick={() => setMenuOpen(false)}

              >

                Products

              </a>

              <a

                href="#about"

                className="px-2 py-3 text-gray-700 hover:text-purple-600"

                onClick={() => setMenuOpen(false)}

              >

                About

              </a>

              <a

                href="#contact"

                className="px-2 py-3 text-gray-700 hover:text-purple-600"

                onClick={() => setMenuOpen(false)}

              >

                Contact

              </a>

            </div>

          )}

        </div>

      </nav>

      {/* ================= CONTENT + IMAGE CAROUSEL ================= */}
      <section className="relative w-full touch-pan-y overflow-hidden bg-white select-none" onPointerDown={handleCarouselPointerDown} onPointerUp={handleCarouselPointerUp} onPointerCancel={() => { dragStart.current = null; }}>
        <div className="relative min-h-140 sm:min-h-152 md:min-h-136">
          {bannerSlides.map((item, index) => (
            <div
              key={`${item.image}-${index}`}
              aria-hidden={index !== slide}
              className={`absolute inset-0 transform transition-all duration-700 ease-in-out ${
                index === slide
                  ? "z-10 translate-x-0 opacity-100"
                  : slideDirection === 1
                    ? "pointer-events-none z-0 -translate-x-full opacity-0"
                    : "pointer-events-none z-0 translate-x-full opacity-0"
              }`}
            >
              <div className="mx-auto grid min-h-140 max-w-7xl grid-cols-1 items-center gap-4 px-4 py-8 sm:min-h-152 sm:gap-6 sm:px-8 sm:py-8 md:min-h-136 md:grid-cols-2 md:gap-10 md:py-10 lg:px-16">
                {/* Left: heading, description, button */}
                <div className="order-2 min-w-0 text-center md:order-1 md:text-left">
                  <h1 className="wrap-break-word text-[clamp(1.5rem,7vw,2.25rem)] font-extrabold leading-[1.08] text-slate-900 sm:text-4xl lg:text-5xl">
                    {item.heading}
                  </h1>
                  <p className="mx-auto mt-4 max-w-xl text-[0.8125rem] leading-5 text-slate-600 sm:mt-5 sm:text-lg sm:leading-7 md:mx-0">
                    {item.description}
                  </p>
                  <Link
                    href={item.buttonLink}
                    onClick={(event) => {
                      if (item.buttonLink === "/#products") {
                        event.preventDefault();
                        document
                          .getElementById("products")
                          ?.scrollIntoView({ behavior: "smooth", block: "start" });
                        window.history.replaceState(null, "", "#products");
                      }
                    }}
                    tabIndex={index === slide ? 0 : -1}
                    className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-purple-600 px-5 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 sm:mt-7 sm:w-auto sm:px-6"
                  >
                    {item.buttonText}
                  </Link>
                </div>

                {/* Right: transparent PNG */}
                <div className="order-1 flex h-48 min-h-0 items-center justify-center sm:h-60 md:order-2 md:h-100">
                  <Image
                    src={item.image}
                    alt={item.heading}
                    width={700}
                    height={500}
                    priority={index === 0}
                    loading={index === 0 ? "eager" : "lazy"}
                    sizes="(max-width: 767px) 90vw, 50vw"
                    className="h-full w-full object-contain"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Previous slide */}
        <button
          type="button"
          aria-label="Previous slide"
          onClick={() => {
             setSlideDirection(-1);
             setSlide(
               (current) =>
                 (current - 1 + bannerSlides.length) % bannerSlides.length,
             );
           }}
          className="absolute left-2 top-1/2 z-20 flex size-8 -translate-y-1/2 items-center justify-center rounded-full border bg-white/90 shadow sm:left-4 sm:size-9"
        >
          <ArrowLeft className="size-4" />
        </button>

        {/* Next slide */}
        <button
          type="button"
          aria-label="Next slide"
          onClick={() => {
             setSlideDirection(1);
             setSlide((current) => (current + 1) % bannerSlides.length);
           }}
           className="absolute right-2 top-1/2 z-20 flex size-8 -translate-y-1/2 items-center justify-center rounded-full border bg-white/90 shadow sm:right-4 sm:size-9"
        >
          <ArrowRight className="size-4" />
        </button>
      </section>

      {/* Features Grid */}

      <section className="scroll-mt-20 bg-white py-10 sm:py-16" id="about">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center mb-8 sm:mb-12">

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">

              Why Choose Sonic Industries

            </h2>

            <p className="text-lg text-gray-600 max-w-2xl mx-auto">

              We deliver excellence through innovation, quality, and

              customer-first approach

            </p>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">

            {features.map((feature, index) => (

              <div

                key={index}

                className="bg-linear-to-br from-purple-50 to-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-purple-100 cursor-pointer"

              >

                <div className="text-purple-600 mb-4">{feature.icon}</div>

                <h3 className="text-xl font-semibold text-gray-900 mb-2">

                  {feature.title}

                </h3>

                <p className="text-gray-600">{feature.description}</p>

              </div>

            ))}

          </div>

        </div>

      </section>

      {/* Products Section */}

      <section className="scroll-mt-20 bg-gray-50 py-10 sm:py-16" id="products">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center mb-8 sm:mb-12">

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">

              Our Product Range

            </h2>

            <p className="text-base sm:text-lg text-gray-600">

              Comprehensive packaging and automation solutions for every

              industry

            </p>

          </div>

          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">

            {(showAllProducts
                 ? orderedCategories
                   : orderedCategories.slice(0, 15)
                                                   ).map(
              (category) => (

              <div key={category._id} className="w-[calc(50%-0.375rem)] max-w-55 sm:w-55">

                <Link

                  href={`/${category.slug}`}

                  prefetch

                  aria-label={category.name}

                  className="block"

                >

                  <div className="group aspect-square w-full sm:w-55 sm:h-55 bg-gray-100 rounded-xl overflow-hidden shadow-sm border border-gray-100 flex items-center justify-center">

                    {categoryImages[category._id] ? (

                      <Image

                        src={categoryImages[category._id]!}

                        alt={category.name}

                        width={220}

                        height={220}

                        className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"

                      />

                    ) : (

                      <Package className="w-12 h-12 sm:w-16 sm:h-16 text-purple-600 transition-transform duration-300 group-hover:scale-110" />

                    )}

                  </div>

                </Link>

                <h3 className="mt-3 text-sm sm:text-lg font-semibold text-gray-900 text-center wrap-break-word leading-snug">

                  <Link

                    href={`/${category.slug}`}

                    prefetch

                    className="hover:text-purple-600 transition-colors"

                  >

                    {category.name}

                  </Link>

                </h3>

              </div>

              ),

            )}

          </div>

          {!showAllProducts && categories.length > 15 && (

            <div className="text-center mt-12">

              <button

                type="button"

                onClick={() => setShowAllProducts(true)}

                className="inline-block w-full max-w-xs sm:w-auto bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 sm:px-10 py-4 rounded-lg transition-all duration-300 hover:shadow-lg"

              >

                View All Products

              </button>

            </div>

          )}

        </div>

      </section>

      {/* Contact Section */}

      <section className="scroll-mt-20 bg-white py-10 sm:py-16" id="contact">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center mb-8 sm:mb-12">

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">

              Get In Touch

            </h2>

            <p className="text-lg text-gray-600">

              Have questions? We&apos;re here to help you find the perfect solution

            </p>

          </div>

          <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">

            <div className="bg-linear-to-br from-purple-50 to-white p-6 sm:p-8 rounded-xl shadow-lg text-center border border-purple-100">

              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">

                <Phone className="w-8 h-8 text-purple-600" />

              </div>

              <h3 className="text-xl font-semibold text-gray-900 mb-2">

                Phone

              </h3>

              <a href="tel:+918010735898" className="text-gray-600 hover:text-purple-600">

                +91 8010735898

              </a>

              <p className="text-gray-600">Mon - Fri: 10 AM - 6 PM IST</p>

            </div>

            <div className="bg-linear-to-br rounded-xl border border-purple-100 from-purple-50 to-white p-6 text-center shadow-lg sm:p-8">

              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">

                <Mail className="w-8 h-8 text-purple-600" />

              </div>

              <h3 className="text-xl font-semibold text-gray-900 mb-2">

                Email

              </h3>

              <a

                href="mailto:sonicindustriesofficial@gmail.com"

                className="text-gray-600 hover:text-purple-600 break-all"

              >

                sonicindustriesofficial@gmail.com

              </a>

            </div>

            <div className="bg-linear-to-br rounded-xl border border-purple-100 from-purple-50 to-white p-6 text-center shadow-lg sm:p-8 md:col-span-2 lg:col-span-1">

              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">

                <MapPin className="w-8 h-8 text-purple-600" />

              </div>

              <h3 className="text-xl font-semibold text-gray-900 mb-2">

                Address

              </h3>

              <p className="text-gray-600">

                Nallasopara West, Palghar-401203, Maharashtra, India

              </p>

            </div>

          </div>

        </div>

      </section>

      {/* Footer */}

      <footer className="bg-gray-900 text-white py-12">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">

            {/* Company Info */}

            <div className="col-span-1 md:col-span-2">

              <div className="flex items-center mb-4">

                <div className="w-10 h-12 relative mr-2">

                  <Image

                    src="/Sonic Logo.png"

                    alt="Sonic Industries Logo"

                    width={40}

                    height={48}

                    className="w-10 h-12"

                  />

                </div>

                <div className="text-xl font-bold">

                  <div className="text-white">SONIC</div>

                  <div className="text-white">INDUSTRIES</div>

                </div>

              </div>

              <p className="text-gray-400 mb-4 max-w-md">

                Leading manufacturer of high-quality packaging machinery and

                solutions. Delivering innovation, precision, and reliability

                across industries since our inception.

              </p>

              <div className="flex gap-4">

                <a

                  href="https://www.facebook.com/sonicpackagingindustries"

                  target="_blank"

                  rel="noopener noreferrer"

                  className="w-10 h-10 bg-[#1877F2] rounded-full flex items-center justify-center hover:opacity-80 transition"

                >

                  <Facebook className="w-5 h-5" />

                </a>

                <a

                  href="https://www.instagram.com/sonicpackagingindustries/"

                  target="_blank"

                  rel="noopener noreferrer"

                  className="w-10 h-10 bg-linear-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF] rounded-full flex items-center justify-center hover:opacity-80 transition"

                >

                  <Instagram className="w-5 h-5" />

                </a>

                <a

                  href="https://www.youtube.com/@packagingmachinerybysonic"

                  target="_blank"

                  rel="noopener noreferrer"

                  className="w-10 h-10 bg-[#FF0000] rounded-full flex items-center justify-center hover:opacity-80 transition"

                >

                  <Youtube className="w-5 h-5" />

                </a>

                <a

                  href="https://in.linkedin.com/company/sonic-industries"

                  target="_blank"

                  rel="noopener noreferrer"

                  className="w-10 h-10 bg-[#0077B5] rounded-full flex items-center justify-center hover:opacity-80 transition"

                >

                  <Linkedin className="w-5 h-5" />

                </a>

              </div>

            </div>

            {/* Quick Links */}

            <div>

              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>

              <ul className="space-y-2">

                <li>

                  <a

                    href="#products"

                    className="text-gray-400 hover:text-purple-400 transition"

                  >

                    Products

                  </a>

                </li>

                <li>

                  <a

                    href="#about"

                    className="text-gray-400 hover:text-purple-400 transition"

                  >

                    About Us

                  </a>

                </li>

                <li>

                  <a

                    href="#contact"

                    className="text-gray-400 hover:text-purple-400 transition"

                  >

                    Contact

                  </a>

                </li>

              </ul>

            </div>

            {/* Policies */}

            <div>

              <h3 className="text-lg font-semibold mb-4">Policies</h3>

              <ul className="space-y-2">

                <li>

                  <Link

                    href="/privacy-policy"

                    className="text-gray-400 hover:text-purple-400 transition"

                  >

                    Privacy Policy

                  </Link>

                </li>

                <li>

                  <Link

                    href="/terms-and-conditions"

                    className="text-gray-400 hover:text-purple-400 transition"

                  >

                    Terms & Conditions

                  </Link>

                </li>

                <li>

                  <Link

                    href="/refund-policy"

                    className="text-gray-400 hover:text-purple-400 transition"

                  >

                    Refund & Cancellation

                  </Link>

                </li>

                <li>

                  <Link

                    href="/shipping-policy"

                    className="text-gray-400 hover:text-purple-400 transition"

                  >

                    Shipping & Delivery

                  </Link>

                </li>

              </ul>

            </div>

          </div>

          {/* Bottom Bar */}

          <div className="border-t border-gray-800 pt-8">

            <div className="flex flex-col md:flex-row justify-between items-center gap-4">

              <p className="text-gray-400 text-sm text-center md:text-left">

                Copyright © {new Date().getFullYear()}{" "}

                <span className="text-purple-400 font-semibold">

                  Sonic Industries

                </span>

                . All rights reserved.

              </p>

              <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-gray-400">

                <Link

                  href="/privacy-policy"

                  className="hover:text-purple-400 transition"

                >

                  Privacy

                </Link>

                <span>•</span>

                <Link

                  href="/terms-and-conditions"

                  className="hover:text-purple-400 transition"

                >

                  Terms

                </Link>

                <span>•</span>

                <Link

                  href="/refund-policy"

                  className="hover:text-purple-400 transition"

                >

                  Refunds

                </Link>

                <span>•</span>

                <Link

                  href="/shipping-policy"

                  className="hover:text-purple-400 transition"

                >

                  Shipping

                </Link>

              </div>

            </div>

          </div>

        </div>

      </footer>

    </div>

  );

}

