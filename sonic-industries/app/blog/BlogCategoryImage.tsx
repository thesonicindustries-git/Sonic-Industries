"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type BlogCategoryImageProps = {
  href: string;
  imageUrl: string;
  title: string;
};

export default function BlogCategoryImage({
  href,
  imageUrl,
  title,
}: BlogCategoryImageProps) {
  const [showExplore, setShowExplore] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const revealExplore = useCallback(() => {
    setShowExplore(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowExplore(false), 2000);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.matchMedia("(max-width: 767px)").matches) revealExplore();
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [revealExplore]);

  const handleImageClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!window.matchMedia("(max-width: 767px)").matches) return;

    const target = event.target as HTMLElement;
    if (target.closest("a[data-explore-link]")) return;

    event.preventDefault();
    revealExplore();
  };

  return (
    <div
      className="group relative aspect-video w-full overflow-hidden rounded-xl bg-gray-100"
      onClick={handleImageClick}
    >
      <Link
        href={href}
        aria-label={`Explore ${title}`}
        className="absolute inset-0 block"
      >
        <Image
          src={imageUrl}
          alt={title}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 768px"
          className="object-contain"
        />
      </Link>

      <Link
        href={href}
        data-explore-link
        className={`z-10 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-opacity hover:bg-red-700 md:pointer-events-none md:opacity-0 md:group-hover:pointer-events-auto md:group-hover:opacity-100 ${
          showExplore ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        Explore
      </Link>
    </div>
  );
}
