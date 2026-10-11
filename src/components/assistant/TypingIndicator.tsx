"use client";

import React from "react";
import { motion } from "framer-motion";

export const TypingIndicator: React.FC<{ label?: string }> = ({
  label = "جاري التفكير وصياغة الرد...",
}) => {
  const dotTransition = {
    duration: 0.6,
    repeat: Infinity,
    repeatType: "reverse" as const,
    ease: "easeInOut",
  };

  return (
    <div
      className="flex items-center gap-2 px-3.5 py-2.5 rounded-card bg-canvas/80 border border-border/80 w-fit"
      role="status"
      aria-label={label}
    >
      <div className="flex items-center gap-1.5" aria-hidden="true">
        <motion.span
          className="w-2 h-2 rounded-full bg-accent-500"
          animate={{ y: [0, -5, 0], opacity: [0.5, 1, 0.5] }}
          transition={{ ...dotTransition, delay: 0 }}
        />
        <motion.span
          className="w-2 h-2 rounded-full bg-accent-500"
          animate={{ y: [0, -5, 0], opacity: [0.5, 1, 0.5] }}
          transition={{ ...dotTransition, delay: 0.15 }}
        />
        <motion.span
          className="w-2 h-2 rounded-full bg-accent-500"
          animate={{ y: [0, -5, 0], opacity: [0.5, 1, 0.5] }}
          transition={{ ...dotTransition, delay: 0.3 }}
        />
      </div>
      <span className="text-xs text-ink-600 font-sans">{label}</span>
    </div>
  );
};
