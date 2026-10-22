"use client";

import React from "react";

/**
 * Renders simple blog text safely (no dangerouslySetInnerHTML, so no XSS).
 *
 * Writing guide for the admin:
 *   ## Big heading
 *   ### Small heading
 *   - bullet point
 *   **bold text**
 *   Leave an empty line between paragraphs.
 */

const renderInline = (text: string): React.ReactNode[] =>
  text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.length > 4 && part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i}>{part.slice(2, -2)}</strong>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    )
  );

export default function BlogContent({ content }: { content: string }) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const elements: React.ReactNode[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    elements.push(
      <p key={elements.length} className="whitespace-pre-line">
        {renderInline(paragraph.join("\n"))}
      </p>
    );
    paragraph = [];
  };

  const flushList = () => {
    if (!list.length) return;
    elements.push(
      <ul key={elements.length} className="list-disc space-y-1 pl-6">
        {list.map((item, i) => (
          <li key={i}>{renderInline(item)}</li>
        ))}
      </ul>
    );
    list = [];
  };

  for (const raw of lines) {
    const line = raw.trim();

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    if (line.startsWith("### ")) {
      flushParagraph();
      flushList();
      elements.push(
        <h3 key={elements.length} className="pt-2 text-xl font-semibold text-gray-900">
          {renderInline(line.slice(4))}
        </h3>
      );
      continue;
    }

    if (line.startsWith("## ")) {
      flushParagraph();
      flushList();
      elements.push(
        <h2 key={elements.length} className="pt-4 text-2xl font-bold text-gray-900">
          {renderInline(line.slice(3))}
        </h2>
      );
      continue;
    }

    if (line.startsWith("- ")) {
      flushParagraph();
      list.push(line.slice(2));
      continue;
    }

    flushList();
    paragraph.push(line);
  }

  flushParagraph();
  flushList();

  return (
    <div className="space-y-5 text-base leading-8 text-gray-800 sm:text-lg">
      {elements}
    </div>
  );
}
