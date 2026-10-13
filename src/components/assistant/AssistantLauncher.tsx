"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { Monogram } from "@/components/brand/Monogram";
import { useTranslations, useLocale } from "next-intl";

// Lazy-load the chat modal so the main dashboard load is completely unblocked
const AssistantChat = dynamic(
  () => import("./AssistantChat").then((mod) => mod.AssistantChat),
  { ssr: false },
);

interface AssistantLauncherProps {
  userRole?: string;
}

interface Position {
  x: number;
  y: number;
}

const STORAGE_KEY = "mohasby_assistant_fab_pos_v2";
const BUTTON_SIZE = 52;
const MARGIN = 16;

export const AssistantLauncher: React.FC<AssistantLauncherProps> = ({
  userRole = "admin",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 24, y: 24 });
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const dragRef = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    hasMoved: boolean;
  } | null>(null);

  const justDraggedRef = useRef(false);
  const t = useTranslations("assistant");
  const locale = useLocale();
  const isRtl = locale === "ar";

  const clampPosition = (pos: Position): Position => {
    if (typeof window === "undefined") return pos;
    const maxX = window.innerWidth - BUTTON_SIZE - MARGIN;
    const maxY = window.innerHeight - BUTTON_SIZE - MARGIN;
    return {
      x: Math.max(MARGIN, Math.min(Math.max(MARGIN, maxX), pos.x)),
      y: Math.max(MARGIN, Math.min(Math.max(MARGIN, maxY), pos.y)),
    };
  };

  // On mount: load saved position or calculate default
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed?.x === "number" && typeof parsed?.y === "number") {
          setPosition(clampPosition(parsed));
          return;
        }
      }
    } catch {
      // Ignore storage errors
    }

    // Default position:
    // In RTL, place at bottom-left (x = MARGIN, y = innerHeight - BUTTON_SIZE - MARGIN)
    // In LTR, place at bottom-right
    const defX = isRtl
      ? MARGIN + 8
      : Math.max(MARGIN, window.innerWidth - BUTTON_SIZE - MARGIN - 8);
    const defY = Math.max(MARGIN, window.innerHeight - BUTTON_SIZE - MARGIN - 8);
    setPosition(clampPosition({ x: defX, y: defY }));
  }, [isRtl]);

  // Adjust on window resize
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => clampPosition(prev));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Pointer drag handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return; // Only main left click
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: position.x,
      originY: position.y,
      hasMoved: false,
    };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;

    if (!dragRef.current.hasMoved && Math.hypot(dx, dy) > 5) {
      dragRef.current.hasMoved = true;
      setIsDragging(true);
    }

    if (dragRef.current.hasMoved) {
      const newPos = clampPosition({
        x: dragRef.current.originX + dx,
        y: dragRef.current.originY + dy,
      });
      setPosition(newPos);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragRef.current) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }

    if (dragRef.current.hasMoved) {
      justDraggedRef.current = true;
      setIsDragging(false);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
      } catch {
        // Ignore
      }
      setTimeout(() => {
        justDraggedRef.current = false;
      }, 80);
    }

    dragRef.current = null;
  };

  const handleClick = () => {
    if (justDraggedRef.current) return;
    setIsOpen(true);
  };

  return (
    <>
      {/* Floating Draggable Action Button (FAB) */}
      {!isOpen && (
        <div
          style={
            mounted
              ? {
                  position: "fixed",
                  left: `${position.x}px`,
                  top: `${position.y}px`,
                  zIndex: 45,
                }
              : undefined
          }
          className={`${
            mounted ? "" : "fixed bottom-6 start-6 z-45"
          } print:hidden select-none touch-none`}
        >
          <div className="relative group">
            <button
              type="button"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onClick={handleClick}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              aria-label={t("launcherAria")}
              aria-haspopup="dialog"
              aria-expanded={isOpen}
              className={`relative flex items-center justify-center w-[52px] h-[52px] rounded-full bg-gradient-to-br from-green-800 via-green-700 to-green-900 text-white shadow-xl shadow-green-950/40 border-2 border-emerald-400/50 transition-all duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-accent-400 focus:ring-offset-2 ${
                isDragging
                  ? "cursor-grabbing scale-110 shadow-2xl shadow-emerald-900/60 ring-2 ring-emerald-400 opacity-95"
                  : "cursor-grab hover:scale-105 hover:border-emerald-300 hover:shadow-emerald-900/50 active:scale-95"
              }`}
            >
              {/* Pulsing online indicator dot */}
              <span
                className="absolute top-0.5 end-0.5 w-3 h-3 rounded-full bg-accent-400 ring-2 ring-green-900 animate-pulse pointer-events-none"
                aria-hidden="true"
              />

              {/* Official site logo mark inside circular button */}
              <div className="flex items-center justify-center w-full h-full p-2.5 pointer-events-none">
                <Monogram
                  direction="tick"
                  size={26}
                  color="white"
                  withAccent={true}
                />
              </div>
            </button>

            {/* Smart dynamic tooltip: only shows when hovered and not dragging */}
            {isHovered && !isDragging && (
              <div
                className={`absolute pointer-events-none whitespace-nowrap px-3 py-1.5 rounded-lg bg-green-950/90 text-white text-xs font-kufi font-medium shadow-lg border border-emerald-500/30 backdrop-blur-sm z-50 animate-fade-in ${
                  position.y > 70
                    ? "-top-10 left-1/2 -translate-x-1/2"
                    : "top-14 left-1/2 -translate-x-1/2"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="font-bold">{t("title")}</span>
                  <span className="text-[10px] text-emerald-300/80 font-normal">
                    (اسحب للتحريك)
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Render Chat when opened */}
      <AssistantChat
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        userRole={userRole}
        locale={locale}
      />
    </>
  );
};
