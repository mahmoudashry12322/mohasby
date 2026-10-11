"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { Bot, MessageSquare } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";

// Lazy-load the chat modal so the main dashboard load is completely unblocked
const AssistantChat = dynamic(
  () => import("./AssistantChat").then((mod) => mod.AssistantChat),
  { ssr: false },
);

interface AssistantLauncherProps {
  userRole?: string;
}

export const AssistantLauncher: React.FC<AssistantLauncherProps> = ({
  userRole = "admin",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations("assistant");
  const locale = useLocale();

  return (
    <>
      {/* Floating Action Button (FAB) */}
      {!isOpen && (
        <div className="fixed bottom-6 end-6 z-40 print:hidden">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label={t("launcherAria")}
            aria-haspopup="dialog"
            aria-expanded={isOpen}
            className="group relative flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-green-800 to-green-700 text-white rounded-panel shadow-elevated hover:shadow-accent-glow hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 ease-ledger border border-accent-500/30 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2"
          >
            {/* Pulsing indicator ring */}
            <span
              className="absolute -top-1 -end-1 w-3.5 h-3.5 rounded-full bg-accent-500 ring-4 ring-white animate-pulse"
              aria-hidden="true"
            />

            <div className="relative flex items-center justify-center w-7 h-7 rounded-full bg-white/10 group-hover:bg-accent-500/20 transition-colors">
              <Bot className="w-4 h-4 text-accent-400 group-hover:text-accent-300 transition-colors" />
            </div>

            <span className="text-xs sm:text-sm font-bold font-kufi tracking-wide">
              {t("title")}
            </span>
          </button>
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
