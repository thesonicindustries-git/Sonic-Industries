"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Package, Gift, Tag } from "lucide-react";

/* ============================================================
   TIMING SETTINGS (all values are in SECONDS, change only these)
   ============================================================ */

// Pehla popup page khulne ke kitne second baad aaye (random, min se max ke beech)
const FIRST_POPUP_DELAY = { min: 5, max: 10 };

// Ek popup gayab hone ke baad agla popup kitne second baad aaye (random)
const GAP_BETWEEN_POPUPS = { min: 10, max: 20 }; // 3 se 4 minute

// Popup kitne second screen par dikhe
const SHOW_DURATION = 4;

/* ============================================================ */

const messages = [
  {
    text: "customer from Delhi purchased a Band Sealer Machine!",
    icon: "shopping",
  },
  {
    text: "A customer from Mumbai just ordered a Shrink Tunnel Machine!",
    icon: "package",
  },
  {
    text: "New order received for Vacuum Packaging Machine!",
    icon: "shopping",
  },
  {
    text: "Ankur from Jaipur bought the Continuous Band Sealer!",
    icon: "shopping",
  },
  {
    text: "Priya added a Carton Sealing Machine to her cart.",
    icon: "package",
  },
  {
    text: "Ravi from Chennai placed an order for Packing Roll!",
    icon: "shopping",
  },
  {
    text: "A user from Pune is checking out the Box Strapping Machine.",
    icon: "package",
  },
  { text: "Limited-time offer claimed by someone from Nagpur!", icon: "tag" },
  {
    text: "Customer from Kolkata ordered a Hand Sealer Machine.",
    icon: "shopping",
  },
  { text: "A visitor unlocked a ₹500 coupon!", icon: "gift" },
  { text: "Rahul from Surat just won a smartwatch!", icon: "gift" },
];

const getIcon = (type: string) => {
  const base = "w-4 h-4 sm:w-5 sm:h-5";
  switch (type) {
    case "shopping":
      return <ShoppingBag className={`${base} text-emerald-600`} />;
    case "package":
      return <Package className={`${base} text-blue-600`} />;
    case "gift":
      return <Gift className={`${base} text-purple-600`} />;
    case "tag":
      return <Tag className={`${base} text-orange-600`} />;
    default:
      return <ShoppingBag className={`${base} text-emerald-600`} />;
  }
};

// random number of milliseconds between min and max seconds
const randomMs = (range: { min: number; max: number }) =>
  (range.min + Math.random() * (range.max - range.min)) * 1000;

export default function FakePopup() {
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState(messages[0]);
  const lastIndex = useRef(-1);

  useEffect(() => {
    let showTimer: ReturnType<typeof setTimeout>;
    let hideTimer: ReturnType<typeof setTimeout>;

    const pickMessage = () => {
      // never show the same message twice in a row
      let index = Math.floor(Math.random() * messages.length);
      if (index === lastIndex.current) {
        index = (index + 1) % messages.length;
      }
      lastIndex.current = index;
      return messages[index];
    };

    const schedule = (delayMs: number) => {
      showTimer = setTimeout(() => {
        setMsg(pickMessage());
        setShow(true);

        hideTimer = setTimeout(() => {
          setShow(false);
          // new random gap every time
          schedule(randomMs(GAP_BETWEEN_POPUPS));
        }, SHOW_DURATION * 1000);
      }, delayMs);
    };

    schedule(randomMs(FIRST_POPUP_DELAY));

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  return (
    // Outer wrapper handles position + z-index (above navbar, below it on screen)
    <div
      className="
        pointer-events-none fixed z-60
        bottom-4 left-0 right-0 flex justify-center
        sm:bottom-auto sm:left-auto sm:right-6 sm:top-20 sm:block
      "
    >
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="
              pointer-events-auto
              bg-white border border-gray-200
              shadow-xl rounded-xl p-3 sm:p-4
              w-[90vw] max-w-sm
              backdrop-blur-sm
            "
          >
            <div className="flex items-start gap-3">
              <div className="shrink-0 mt-0.5">{getIcon(msg.icon)}</div>

              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-gray-800 leading-relaxed font-medium">
                  {msg.text}
                </p>

                <div className="flex items-center gap-1.5 mt-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] sm:text-xs text-gray-500">
                    Just now
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}