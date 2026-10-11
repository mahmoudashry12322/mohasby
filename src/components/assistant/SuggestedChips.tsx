"use client";

import React from "react";
import { Sparkles } from "lucide-react";

interface SuggestedChipsProps {
  chips: string[];
  onSelect: (chip: string) => void;
  disabled?: boolean;
}

export const SuggestedChips: React.FC<SuggestedChipsProps> = ({
  chips,
  onSelect,
  disabled = false,
}) => {
  if (!chips || chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 pt-2">
      {chips.map((chip, idx) => (
        <button
          key={idx}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(chip)}
          className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-chip text-xs font-medium text-ink-900 bg-canvas hover:bg-green-100 hover:text-green-800 border border-border hover:border-accent-500 transition-all ease-ledger duration-200 text-start disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-accent-500"
        >
          <Sparkles className="w-3 h-3 text-accent-500 group-hover:scale-110 transition-transform duration-200 shrink-0" />
          <span>{chip}</span>
        </button>
      ))}
    </div>
  );
};
