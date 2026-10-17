"use client";

import { useRef } from "react";

interface LabelPositionPreviewProps {
  imageSrc?: string;
  x: number; // percent (0 - 100)
  y: number; // percent (0 - 100)
  label?: string;
  onChange: (x: number, y: number) => void;
}

const clamp = (value: number) => Math.min(100, Math.max(0, value));
const round1 = (value: number) => Math.round(value * 10) / 10;

/**
 * Same box shape and image scale as the Hotspots section on the website
 * (4:3 box, image centered at 1.2x, dot placed at left: x%, top: y%),
 * so the dot here lands exactly where it will on the live page.
 */
export default function LabelPositionPreview({
  imageSrc,
  x,
  y,
  label,
  onChange,
}: LabelPositionPreviewProps) {
  const boxRef = useRef<HTMLDivElement>(null);

  const setFromPointer = (clientX: number, clientY: number) => {
    const rect = boxRef.current?.getBoundingClientRect();
    if (!rect || !rect.width || !rect.height) return;

    const newX = ((clientX - rect.left) / rect.width) * 100;
    const newY = ((clientY - rect.top) / rect.height) * 100;
    onChange(round1(clamp(newX)), round1(clamp(newY)));
  };

  if (!imageSrc) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-white p-4 text-center text-sm text-gray-500">
        Position preview ke liye pehle Basic Info me product ki image add karo.
      </div>
    );
  }

  return (
    <div>
      <p className="mb-1 text-xs text-gray-500">
        Image par click ya drag karo, point wahin set ho jayega (X aur Y % me hain).
      </p>

      <div
        ref={boxRef}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          setFromPointer(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (e.buttons === 1) setFromPointer(e.clientX, e.clientY);
        }}
        className="relative mx-auto aspect-4/3 w-full max-w-md cursor-crosshair touch-none select-none overflow-hidden rounded-lg border border-gray-300 bg-white"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt="Product preview"
          draggable={false}
          className="pointer-events-none absolute inset-0 h-full w-full object-contain"
          style={{ transform: "scale(1.2)" }}
        />

        {/* Dot */}
        <div
          className="pointer-events-none absolute"
          style={{
            left: `${clamp(x)}%`,
            top: `${clamp(y)}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <span className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full bg-red-500/40" />
          <span className="relative block h-3 w-3 rounded-full bg-red-500 ring-2 ring-white" />
          {label && (
            <span className="absolute left-1/2 top-4 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900/80 px-1.5 py-0.5 text-[10px] text-white">
              {label}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
