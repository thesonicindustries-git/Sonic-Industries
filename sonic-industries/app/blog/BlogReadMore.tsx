"use client";

import { useEffect, useRef, useState } from "react";
import BlogContent from "./BlogContent";

const WORD_LIMIT = 2000;

export default function BlogReadMore({ content }: { content: string }) {
  const [expanded, setExpanded] = useState(false);
  const expandedAtScrollY = useRef(0);

  const trimmedContent = content.trim();
  const words = trimmedContent ? trimmedContent.split(/\s+/) : [];
  const hasMoreWords = words.length > WORD_LIMIT;
  const hasMoreCharacters = trimmedContent.length > WORD_LIMIT;
  const hasMoreContent = hasMoreWords || hasMoreCharacters;
  const previewContent = hasMoreWords
    ? `${words.slice(0, WORD_LIMIT).join(" ")}...`
    : hasMoreCharacters
      ? `${trimmedContent.slice(0, WORD_LIMIT)}...`
      : content;
  const remainingContent = hasMoreWords
    ? words.slice(WORD_LIMIT).join(" ")
    : hasMoreCharacters
      ? trimmedContent.slice(WORD_LIMIT)
      : "";

  useEffect(() => {
    if (!expanded) return;

    const collapseWhenScrollingAboveButton = () => {
      if (window.scrollY < expandedAtScrollY.current - 24) {
        setExpanded(false);
      }
    };

    window.addEventListener("scroll", collapseWhenScrollingAboveButton, { passive: true });
    return () => window.removeEventListener("scroll", collapseWhenScrollingAboveButton);
  }, [expanded]);

  const showMore = () => {
    expandedAtScrollY.current = window.scrollY;
    setExpanded(true);
  };

  return (
    <div>
      <BlogContent content={previewContent} />

      {hasMoreContent && (
        <div className={expanded ? "mt-8" : "hidden"}>
          <BlogContent content={remainingContent} />
        </div>
      )}

      {hasMoreContent && !expanded && (
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={showMore}
            className="rounded-lg bg-red-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            Read more
          </button>
        </div>
      )}
    </div>
  );
}
