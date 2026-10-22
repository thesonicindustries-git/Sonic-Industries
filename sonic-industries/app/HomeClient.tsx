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
  Search,
} from "lucide-react";
import { CategoryBackend, ProductBackend } from "@/types";
// CHANGE: fuzzy (typo tolerant) search helper
import { fuzzyScore } from "@/lib/fuzzySearch";

const featuredSuggestions = [
  { name: "Handheld Thermal Inkjet Printer", slug: "handheld-thermal-inkjet-printer", type: "Product" as const },
  { name: "Automatic Packaging Machine", slug: "automatic-packaging-machine", type: "Category" as const },
  { name: "Band Sealing Machine", slug: "horizontal-band-sealing-machine", type: "Product" as const },
];

// CHANGE: one common type for search results
type SearchResult = {
  type: "Product" | "Category";
  name: string;
  slug: string;
};

// CHANGE: makes sure we always work with a plain string
const str = (value: unknown): string => (typeof value === "string" ? value : "");

// CHANGE: makes sure keywords is always a list of strings
const strList = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];

const MIN_SEARCH_SCORE = 0.2;

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
  products: ProductBackend[];
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

const AUTOPLAY_MS = 3000;

export default function HomeClient({ categories, products, categoryImages }: Props) {
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const [slide, setSlide] = useState(0);
  const [slideDirection, setSlideDirection] = useState<1 | -1>(1);
  const dragStart = useRef<{ x: number; y: number } | null>(null);

  const goToSlide = (direction: 1 | -1) => {
    setSlideDirection(direction);
    setSlide((current) => (current + direction + bannerSlides.length) % bannerSlides.length);
  };

  const handleCarouselPointerDown = (event: React.PointerEvent<HTMLElement>) => {
    dragStart.current = { x: event.clientX, y: event.clientY };
  };

  const handleCarouselPointerUp = (event: React.PointerEvent<HTMLElement>) => {
    if (!dragStart.current) return;

    const deltaX = event.clientX - dragStart.current.x;
    const deltaY = event.clientY - dragStart.current.y;
    dragStart.current = null;

    if (Math.abs(deltaX) < 48 || Math.abs(deltaX) <= Math.abs(deltaY)) return;

    goToSlide(deltaX > 0 ? -1 : 1);
  };

  // Autoplay. Restarts after any manual change so a slide never flips right after a tap/swipe.
  useEffect(() => {
    const interval = setInterval(() => {
      setSlideDirection(1);
      setSlide((current) => (current + 1) % bannerSlides.length);
    }, AUTOPLAY_MS);

    return () => clearInterval(interval);
  }, [slide]);

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

  // CHANGE: typo tolerant search (replaces the old includes() based search)
  const normalizedSearchQuery = searchQuery.trim();

  let searchResults: SearchResult[] = featuredSuggestions;

  if (normalizedSearchQuery) {
    const productResults = products.map((product) => ({
      type: "Product" as const,
      name: str(product.name),
      slug: str(product.slug),
      score: fuzzyScore(normalizedSearchQuery, [
        { text: str(product.name), weight: 1, fuzzy: true },
        { text: str(product.slug).replace(/-/g, " "), weight: 0.9, fuzzy: true },
        ...strList(product.keywords).map((keyword) => ({
          text: keyword,
          weight: 0.8,
          fuzzy: true,
        })),
        { text: str(product.tagline), weight: 0.4 },
        { text: str(product.description), weight: 0.3 },
      ]),
    }));

    const categoryResults = categories.map((category) => ({
      type: "Category" as const,
      name: str(category.name),
      slug: str(category.slug),
      score: fuzzyScore(normalizedSearchQuery, [
        { text: str(category.name), weight: 1, fuzzy: true },
        { text: str(category.slug).replace(/-/g, " "), weight: 0.9, fuzzy: true },
        { text: str(category.title), weight: 0.8, fuzzy: true },
        ...strList(category.keywords).map((keyword) => ({
          text: keyword,
          weight: 0.8,
          fuzzy: true,
        })),
        { text: str(category.description), weight: 0.3 },
      ]),
    }));

    searchResults = [...productResults, ...categoryResults]
      .filter((result) => result.name && result.slug && result.score >= MIN_SEARCH_SCORE)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map(({ type, name, slug }) => ({ type, name, slug }));
  }

  const orderedCategories = [
    ...customCategoryOrder
      .map((slug) => categories.find((category) => category.slug === slug))
      .filter((category) => category !== undefined),
    ...categories.filter((category) => !customCategoryOrder.includes(category.slug)),
  ];

  const closeMobileSearch = () => {
    setMobileSearchOpen(false);
    setSearchQuery("");
    setIsSearchFocused(false);
  };

  const renderSearchBox = (mobile = false) => (
    <div className={mobile ? "relative min-w-0 flex-1" : "relative w-full"}>
      <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        type="search"
        autoFocus={mobile}
        value={searchQuery}
        onFocus={() => setIsSearchFocused(true)}
        onBlur={mobile ? undefined : () => setTimeout(() => setIsSearchFocused(false), 150)}
        onKeyDown={(event) => {
          if (mobile && event.key === "Escape") closeMobileSearch();
        }}
        onChange={(event) => setSearchQuery(event.target.value)}
        placeholder="Search products or categories"
        aria-label="Search products or categories"
        className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pr-3 pl-9 text-base text-gray-900 transition outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-100 md:text-sm [&::-webkit-search-cancel-button]:appearance-none"
      />
      {(mobile || searchQuery || isSearchFocused) && (
        <div
          className={`z-50 overflow-y-auto overscroll-contain border-gray-200 bg-white shadow-xl ${
            mobile
              ? "fixed top-16 right-0 left-0 max-h-[calc(100dvh-4rem)] border-t"
              : "absolute top-12 right-0 left-0 max-h-80 rounded-lg border"
          }`}
          onWheel={(event) => event.stopPropagation()}
        >
          {searchResults.length > 0 ? (
            searchResults.map((result) => (
              <Link
                key={`${mobile ? "mobile-" : ""}${result.type}-${result.slug}`}
                href={`/${result.slug}`}
                onClick={() => {
                  setSearchQuery("");
                  setIsSearchFocused(false);
                  if (mobile) closeMobileSearch();
                }}
                className="block border-b border-gray-100 px-4 py-3 last:border-0 hover:bg-red-50"
              >
                <span className="block text-sm font-semibold text-gray-900">{result.name}</span>
                <span className="text-xs text-gray-500">{result.type}</span>
              </Link>
            ))
          ) : (
            <p className="px-4 py-3 text-sm text-gray-500">No matching products or categories.</p>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-dvh overflow-x-hidden bg-white pt-16">
      {/* Floating contact buttons */}
      <div className="fixed right-3 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 flex flex-col gap-3 sm:right-4 sm:bottom-[max(1.5rem,env(safe-area-inset-bottom))] sm:gap-4">
        <motion.a
          href="tel:+918010735898"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-green-700 text-white shadow-lg"
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
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg"
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
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center gap-4">
            {/* Logo */}
            <div className={`relative h-11 w-28 shrink-0 sm:h-12 sm:w-36 ${mobileSearchOpen ? "hidden md:block" : ""}`}>
              <Image
                src="/sonic_logo_transparent.png"
                alt="Sonic Industries Logo"
                width={564}
                height={153}
                priority
                className="h-full w-full object-contain object-left"
              />
            </div>

            {/* Desktop / tablet search */}
            <div className="mx-auto hidden w-full max-w-sm md:block lg:max-w-md">
              {renderSearchBox()}
            </div>

            {/* Desktop / tablet links */}
            <div className="hidden shrink-0 gap-6 md:flex">
              <a href="#products" className="text-black-700 transition hover:text-gray-600">
                Products
              </a>
              <a href="#about" className="text-black-700 transition hover:text-gray-600">
                About
              </a>
              {/* CHANGE: Blog link */}
              <Link href="/blog" className="text-black-700 transition hover:text-gray-600">
                Blog
              </Link>
              <a href="#contact" className="text-black-700 transition hover:text-gray-600">
                Contact
              </a>
            </div>

            {/* Mobile: search + menu buttons */}
            <div className={`ml-auto items-center gap-1 md:hidden ${mobileSearchOpen ? "hidden" : "flex"}`}>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-800"
                aria-label="Open search"
                onClick={() => {
                  setMenuOpen(false);
                  setMobileSearchOpen(true);
                }}
              >
                <Search className="h-6 w-6" />
              </button>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-800"
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((open) => !open)}
              >
                {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>

            {/* Mobile: search bar that replaces logo + menu, with close button on the right */}
            {mobileSearchOpen && (
              <div className="flex w-full items-center gap-2 md:hidden">
                {renderSearchBox(true)}
                <button
                  type="button"
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-800"
                  aria-label="Close search"
                  onClick={closeMobileSearch}
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            )}
          </div>

          {menuOpen && (
            <div className="flex max-h-[calc(100dvh-4rem)] flex-col overflow-y-auto border-t border-gray-100 py-3 md:hidden">
              <a
                href="#products"
                className="px-2 py-3 text-black-700 hover:text-red-600"
                onClick={() => setMenuOpen(false)}
              >
                Products
              </a>
              <a
                href="#about"
                className="px-2 py-3 text-black-700 hover:text-red-600"
                onClick={() => setMenuOpen(false)}
              >
                About
              </a>
              {/* CHANGE: Blog link */}
              <Link
                href="/blog"
                className="px-2 py-3 text-black-700 hover:text-red-600"
                onClick={() => setMenuOpen(false)}
              >
                Blog
              </Link>
              <a
                href="#contact"
                className="px-2 py-3 text-black-700 hover:text-red-600"
                onClick={() => setMenuOpen(false)}
              >
                Contact
              </a>
            </div>
          )}
        </div>
      </nav>

      {/* ================= CONTENT + IMAGE CAROUSEL ================= */}
      <section
        className="relative w-full touch-pan-y select-none overflow-hidden bg-white"
        aria-roledescription="carousel"
        aria-label="Featured products"
        onPointerDown={handleCarouselPointerDown}
        onPointerUp={handleCarouselPointerUp}
        onPointerCancel={() => {
          dragStart.current = null;
        }}
      >
        {/* All slides share one grid cell, so the section is as tall as the tallest slide */}
        <div className="grid">
          {bannerSlides.map((item, index) => (
            <div
              key={`${item.image}-${index}`}
              aria-hidden={index !== slide}
              className={`col-start-1 row-start-1 transform transition-all duration-500 ease-in-out motion-reduce:transition-none ${
                index === slide
                  ? "z-10 translate-x-0 opacity-100"
                  : slideDirection === 1
                    ? "pointer-events-none z-0 -translate-x-full opacity-0"
                    : "pointer-events-none z-0 translate-x-full opacity-0"
              }`}
            >
              <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-4 px-4 pt-8 pb-14 sm:gap-6 sm:px-8 md:min-h-136 md:grid-cols-2 md:gap-10 md:py-10 lg:px-16">
                {/* Left: heading, description, button */}
                <div className="order-2 min-w-0 text-center md:order-1 md:text-left">
                  <h1 className="wrap-break-word text-[clamp(1.5rem,7vw,2.25rem)] leading-[1.08] font-extrabold text-slate-900 sm:text-4xl lg:text-5xl">
                    {item.heading}
                  </h1>
                  <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-600 sm:mt-5 sm:text-lg sm:leading-7 md:mx-0">
                    {item.description}
                  </p>
                  <Link
                    href={item.buttonLink}
                    tabIndex={index === slide ? 0 : -1}
                    className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-red-600 px-5 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none sm:mt-7 sm:w-auto sm:px-6"
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
                    draggable={false}
                    className="h-full w-full object-contain"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Previous / next arrows (hidden on phones, where swipe and dots are used) */}
        <button
          type="button"
          aria-label="Previous slide"
          onClick={() => goToSlide(-1)}
          className="absolute top-1/2 left-2 z-20 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border bg-white/90 shadow sm:left-4 sm:flex"
        >
          <ArrowLeft className="size-5" />
        </button>

        <button
          type="button"
          aria-label="Next slide"
          onClick={() => goToSlide(1)}
          className="absolute top-1/2 right-2 z-20 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border bg-white/90 shadow sm:right-4 sm:flex"
        >
          <ArrowRight className="size-5" />
        </button>

        {/* Dots */}
        <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {bannerSlides.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === slide}
              onClick={() => {
                setSlideDirection(index > slide ? 1 : -1);
                setSlide(index);
              }}
              className="flex h-6 w-6 items-center justify-center"
            >
              <span
                className={`block h-2.5 rounded-full transition-all ${
                  index === slide ? "w-6 bg-gray-600" : "w-2.5 bg-gray-300"
                }`}
              />
            </button>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="scroll-mt-20 bg-white py-10 sm:py-16" id="about">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center sm:mb-12">
            <h2 className="mb-4 text-2xl font-bold text-gray-900 sm:text-3xl lg:text-4xl">
              Why Choose Sonic Industries
            </h2>
            <p className="mx-auto max-w-2xl text-base text-gray-600 sm:text-lg">
              We deliver excellence through innovation, quality, and customer-first approach
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-8 lg:grid-cols-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="rounded-xl border border-red-100 bg-linear-to-br from-red-50 to-white p-6 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
              >
                <div className="mb-4 text-red-600">{feature.icon}</div>
                <h3 className="mb-2 text-xl font-semibold text-gray-900">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="scroll-mt-20 bg-gray-50 py-10 sm:py-16" id="products">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center sm:mb-12">
            <h2 className="mb-4 text-2xl font-bold text-gray-900 sm:text-3xl lg:text-4xl">
              Our Product Range
            </h2>
            <p className="text-base text-gray-600 sm:text-lg">
              Comprehensive packaging and automation solutions for every industry
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            {(showAllProducts ? orderedCategories : orderedCategories.slice(0, 15)).map((category) => (
              <div key={category._id} className="w-[calc(50%-0.375rem)] max-w-55 sm:w-55">
                <Link href={`/${category.slug}`} prefetch aria-label={category.name} className="block">
                  <div className="group flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl border border-gray-100 bg-gray-100 shadow-sm">
                    {categoryImages[category._id] ? (
                      <Image
                        src={categoryImages[category._id]!}
                        alt={category.name}
                        width={440}
                        height={440}
                        sizes="(max-width: 640px) 45vw, 220px"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    ) : (
                      <Package className="h-12 w-12 text-red-600 transition-transform duration-300 group-hover:scale-110 sm:h-16 sm:w-16" />
                    )}
                  </div>
                </Link>

                <h3 className="mt-3 text-center text-sm leading-snug font-semibold wrap-break-word text-gray-900 sm:text-lg">
                  <Link
                    href={`/${category.slug}`}
                    prefetch
                    className="transition-colors hover:text-red-600"
                  >
                    {category.name}
                  </Link>
                </h3>
              </div>
            ))}
          </div>

          {!showAllProducts && categories.length > 15 && (
            <div className="mt-12 text-center">
              <button
                type="button"
                onClick={() => setShowAllProducts(true)}
                className="inline-block w-full max-w-xs rounded-lg bg-red-600 px-6 py-4 font-semibold text-white transition-all duration-300 hover:bg-red-700 hover:shadow-lg sm:w-auto sm:px-10"
              >
                View All Products
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Contact Section */}
      <section className="scroll-mt-20 bg-white py-10 sm:py-16" id="contact">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center sm:mb-12">
            <h2 className="mb-4 text-2xl font-bold text-gray-900 sm:text-3xl lg:text-4xl">
              Get In Touch
            </h2>
            <p className="text-base text-gray-600 sm:text-lg">
              Have questions? We&apos;re here to help you find the perfect solution
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            <div className="rounded-xl border border-red-100 bg-linear-to-br from-red-50 to-white p-6 text-center shadow-lg sm:p-8">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <Phone className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900">Phone</h3>
              <a href="tel:+918010735898" className="text-gray-600 hover:text-red-600">
                +91 8010735898
              </a><br></br>
              <a href="tel:+918010735898" className="text-gray-600 hover:text-red-600">
                +91 9321970200
              </a>
            </div>

            <div className="rounded-xl border border-red-100 bg-linear-to-br from-red-50 to-white p-6 text-center shadow-lg sm:p-8">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <Mail className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900">Email</h3>
              <a
                href="mailto:sonicindustriesofficial@gmail.com"
                className="break-all text-gray-600 hover:text-red-600"
              >
                sonicindustriesofficial@gmail.com
              </a>
            </div>

            <div className="rounded-xl border border-red-100 bg-linear-to-br from-red-50 to-white p-6 text-center shadow-lg sm:p-8 md:col-span-2 lg:col-span-1">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <MapPin className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900">Address</h3>
              <p className="text-gray-600">Ground Floor, Office No. A-1, Sai Srushti Apartment, near Bharat Gas, Lakshmiben Chedda Nagar, Nalasopara West, Maharashtra 401203</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-4">
            {/* Company Info */}
            <div className="col-span-1 md:col-span-2">
              {/* Logo */}
            <div className={`relative h-11 w-28 shrink-0 sm:h-12 sm:w-36 ${mobileSearchOpen ? "hidden md:block" : ""}`}>
              <Image
                src="/sonic_industries.png"
                alt="Sonic Industries Logo"
                width={564}
                height={153}
                priority
                className="h-full w-full object-contain object-left"
              />
            </div>

              <p className="mb-4 max-w-md text-gray-400">
                Leading manufacturer of high-quality packaging machinery and solutions. Delivering
                innovation, precision, and reliability across industries since our inception.
              </p>
              <div className="flex gap-4">
                <a
                  href="https://www.facebook.com/sonicpackagingindustries"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1877F2] transition hover:opacity-80"
                >
                  <Facebook className="h-5 w-5" />
                </a>
                <a
                  href="https://www.instagram.com/sonicpackagingindustries/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF] transition hover:opacity-80"
                >
                  <Instagram className="h-5 w-5" />
                </a>
                <a
                  href="https://www.youtube.com/@packagingmachinerybysonic"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FF0000] transition hover:opacity-80"
                >
                  <Youtube className="h-5 w-5" />
                </a>
                <a
                  href="https://in.linkedin.com/company/sonic-industries"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0077B5] transition hover:opacity-80"
                >
                  <Linkedin className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="mb-4 text-lg font-semibold">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#products" className="text-gray-400 transition hover:text-red-400">
                    Products
                  </a>
                </li>
                <li>
                  <a href="#about" className="text-gray-400 transition hover:text-red-400">
                    About Us
                  </a>
                </li>
                {/* CHANGE: Blog link */}
                <li>
                  <Link href="/blog" className="text-gray-400 transition hover:text-red-400">
                    Blog
                  </Link>
                </li>
                <li>
                  <a href="#contact" className="text-gray-400 transition hover:text-red-400">
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            {/* Policies */}
            <div>
              <h3 className="mb-4 text-lg font-semibold">Policies</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/privacy-policy" className="text-gray-400 transition hover:text-red-400">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms-and-conditions" className="text-gray-400 transition hover:text-red-400">
                    Terms &amp; Conditions
                  </Link>
                </li>
                <li>
                  <Link href="/refund-policy" className="text-gray-400 transition hover:text-red-400">
                    Refund &amp; Cancellation
                  </Link>
                </li>
                <li>
                  <Link href="/shipping-policy" className="text-gray-400 transition hover:text-red-400">
                    Shipping &amp; Delivery
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <p className="text-center text-sm text-gray-400 md:text-left">
                Copyright © {new Date().getFullYear()}{" "}
                <span className="font-semibold text-red-600">Sonic Industries</span>. All rights reserved.
              </p>

              <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-gray-400">
                <Link href="/privacy-policy" className="transition hover:text-red-400">
                  Privacy
                </Link>
                <span>•</span>
                <Link href="/terms-and-conditions" className="transition hover:text-red-400">
                  Terms
                </Link>
                <span>•</span>
                <Link href="/refund-policy" className="transition hover:text-red-400">
                  Refunds
                </Link>
                <span>•</span>
                <Link href="/shipping-policy" className="transition hover:text-red-400">
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