"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, Search, X } from "lucide-react";
import { CategoryBackend, ProductBackend } from "@/types";

type SearchItem = { name: string; slug: string; type: "Product" | "Category" };

// Edit these names and slugs to control the suggestions shown on first focus.
const featuredSuggestions: SearchItem[] = [
  { name: "Handheld Thermal Inkjet Printer", slug: "handheld-thermal-inkjet-printer", type: "Product" },
  { name: "Automatic Packaging Machine", slug: "automatic-packaging-machine", type: "Category" },
  { name: "Band Sealing Machine", slug: "horizontal-band-sealing-machine", type: "Product" },
];

const sections = ["home", "about", "features", "products", "testimonial", "faq", "contact"];

const sectionLabel = (section: string) =>
  section === "faq" ? "FAQ" : section.charAt(0).toUpperCase() + section.slice(1);

const Navbar = () => {
  const [active, setActive] = useState("home");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchItems, setSearchItems] = useState<SearchItem[]>([]);

  useEffect(() => {
    const loadSearchItems = async () => {
      try {
        const [categoriesResponse, productsResponse] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/categories`),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/products`),
        ]);
        const categoriesData = await categoriesResponse.json();
        const productsData = await productsResponse.json();
        setSearchItems([
          ...(Array.isArray(productsData.products) ? productsData.products : []).map(
            (item: ProductBackend) => ({ name: item.name, slug: item.slug, type: "Product" as const }),
          ),
          ...(Array.isArray(categoriesData.categories) ? categoriesData.categories : []).map(
            (item: CategoryBackend) => ({ name: item.name, slug: item.slug, type: "Category" as const }),
          ),
        ]);
      } catch {
        setSearchItems([]);
      }
    };
    loadSearchItems();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY < 120) {
        setActive("home");
        return;
      }

      const scrollY = window.scrollY + 80;
      for (const sec of sections) {
        const el = document.getElementById(sec);
        if (el && scrollY >= el.offsetTop && scrollY < el.offsetTop + el.offsetHeight) {
          setActive(sec);
          break;
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMenu = () => setIsMenuOpen((open) => !open);
  const closeMenu = () => setIsMenuOpen(false);

  const closeMobileSearch = () => {
    setIsMobileSearchOpen(false);
    setSearchQuery("");
    setIsSearchFocused(false);
  };

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const availableSearchItems = searchItems.length > 0 ? searchItems : featuredSuggestions;
  const searchResults = normalizedSearchQuery
    ? availableSearchItems.filter((item) => item.name.toLowerCase().includes(normalizedSearchQuery)).slice(0, 8)
    : featuredSuggestions;

  // Search box + results. `mobile` = full-width bar that covers the navbar, with an X on the right.
  const renderSearch = (mobile = false) => {
    const searchBox = (
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
          onChange={(event) => {
            setSearchQuery(event.target.value);
            setIsSearchFocused(true);
          }}
          placeholder="Search products or categories"
          aria-label="Search products or categories"
          className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pr-3 pl-10 text-base outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-100 lg:text-sm [&::-webkit-search-cancel-button]:appearance-none"
        />

        {(mobile || searchQuery || isSearchFocused) && (
          <div
            className={`z-110 overflow-y-auto overscroll-contain border-gray-200 bg-white shadow-xl ${
              mobile
                ? "fixed top-16 right-0 left-0 max-h-[calc(100dvh-4rem)] border-t"
                : "absolute top-12 right-0 left-0 max-h-80 rounded-lg border"
            }`}
            onWheel={(event) => event.stopPropagation()}
          >
            {searchResults.length ? (
              searchResults.map((item) => (
                <Link
                  key={`${item.type}-${item.slug}`}
                  href={`/${item.slug}`}
                  onClick={() => {
                    setSearchQuery("");
                    setIsSearchFocused(false);
                    setIsMenuOpen(false);
                    if (mobile) closeMobileSearch();
                  }}
                  className="block border-b border-gray-100 px-4 py-3 last:border-0 hover:bg-red-50"
                >
                  <span className="block text-sm font-semibold text-gray-900">{item.name}</span>
                  <span className="text-xs text-gray-500">{item.type}</span>
                </Link>
              ))
            ) : (
              <p className="px-4 py-3 text-sm text-gray-500">No matching products or categories.</p>
            )}
          </div>
        )}
      </div>
    );

    if (!mobile) return searchBox;

    return (
      <div className="absolute inset-0 z-30 flex items-center gap-2 bg-white px-4 sm:px-6 lg:hidden">
        {searchBox}
        <button
          type="button"
          onClick={closeMobileSearch}
          className="flex h-10 w-10 shrink-0 items-center justify-center text-gray-700"
          aria-label="Close search"
        >
          <X className="h-6 w-6" />
        </button>
      </div>
    );
  };

  return (
    <nav className="fixed inset-x-0 top-0 z-100 w-full max-w-full bg-white shadow-sm">
      <div className="relative grid h-16 w-full min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-4 sm:gap-3 sm:px-6 lg:grid-cols-[auto_minmax(180px,1fr)_auto] lg:px-8">
        {/* Sonic Logo */}
        <div
          className={`relative mr-1 h-10 w-24 shrink-0 sm:mr-2 sm:h-11 sm:w-28 lg:h-12 lg:w-36 ${
            isMobileSearchOpen ? "hidden lg:block" : ""
          }`}
        >
          <Link href="/" className="flex h-full w-full cursor-pointer items-center">
            <Image
              src="/sonic_logo_transparent.png"
              alt="Sonic Industries Logo"
              width={564}
              height={153}
              priority
              className="h-full w-full object-contain object-left"
            />
          </Link>
        </div>

        {/* Desktop search (large screens only) */}
        <div className="hidden w-full max-w-80 min-w-0 justify-self-center lg:block">{renderSearch()}</div>

        {/* Desktop menu */}
        <ul className="hidden justify-self-end space-x-1 font-semibold lg:flex xl:space-x-5">
          {sections.map((section) => (
            <li key={section}>
              <a
                href={`#${section}`}
                onClick={() => setActive(section)}
                className={`relative block px-1 py-2 text-sm whitespace-nowrap transition-colors duration-300 xl:text-base ${
                  active === section ? "text-gray-600" : "hover:text-gray-400"
                }`}
              >
                {sectionLabel(section)}
                <span
                  className={`absolute bottom-0 left-0 h-0.5 w-full transform bg-gray-600 transition-transform duration-300 ${
                    active === section ? "scale-x-100" : "scale-x-0"
                  }`}
                ></span>
              </a>
            </li>
          ))}
        </ul>

        {/* Mobile / tablet: search icon + animated menu button */}
        {!isMobileSearchOpen && (
          <div className="col-start-3 flex items-center justify-self-end lg:hidden">
            <button
              type="button"
              onClick={() => {
                setIsMobileSearchOpen(true);
                setIsMenuOpen(false);
              }}
              className="flex h-11 w-11 items-center justify-center text-gray-800"
              aria-label="Open search"
            >
              <Search className="h-6 w-6" />
            </button>

            <button
              type="button"
              className="flex h-11 w-11 shrink-0 items-center justify-center text-gray-800 focus:outline-none"
              onClick={toggleMenu}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        )}

        {/* Mobile / tablet: search bar that covers logo + menu, X on the right */}
        {isMobileSearchOpen && renderSearch(true)}
      </div>

      {/* Animated mobile menu */}
      <div
        className={`overflow-y-auto border-t bg-white transition-all duration-300 ease-in-out lg:hidden ${
          isMenuOpen
            ? "max-h-[calc(100dvh-4rem)] opacity-100"
            : "invisible max-h-0 opacity-0"
        }`}
      >
        <ul className="flex flex-col font-medium">
          {sections.map((section, index) => (
            <li
              key={section}
              style={{
                transform: isMenuOpen ? "translateX(0)" : "translateX(-20px)",
                opacity: isMenuOpen ? 1 : 0,
                transition: `all 0.3s ease ${index * 0.05}s`,
              }}
            >
              <a
                href={`#${section}`}
                className={`block border-b px-4 py-3 text-sm transition-colors duration-200 sm:text-base ${
                  active === section ? "bg-red-50 text-red-600" : "text-gray-800 hover:bg-gray-50"
                }`}
                onClick={() => {
                  setActive(section);
                  closeMenu();
                }}
              >
                {sectionLabel(section)}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;