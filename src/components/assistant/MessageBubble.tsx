"use client";

import React, { useState } from "react";
import { Check, Copy, Bot, User } from "lucide-react";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  copyLabel?: string;
  copiedLabel?: string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  role,
  content,
  isStreaming = false,
  copyLabel = "نسخ",
  copiedLabel = "تم النسخ!",
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback or ignore
    }
  };

  const isUser = role === "user";

  return (
    <div
      className={`flex items-start gap-2.5 my-2.5 ${
        isUser ? "flex-row-reverse" : "flex-row"
      }`}
    >
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border ${
          isUser
            ? "bg-green-700 text-white border-green-800"
            : "bg-accent-500 text-white border-accent-600 shadow-sm"
        }`}
        aria-hidden="true"
      >
        {isUser ? (
          <User className="w-3.5 h-3.5" />
        ) : (
          <Bot className="w-3.5 h-3.5" />
        )}
      </div>

      {/* Bubble Container */}
      <div
        className={`relative max-w-[85%] rounded-card px-3.5 py-2.5 text-sm transition-all duration-200 ${
          isUser
            ? "bg-green-700 text-white rounded-se-none shadow-sm"
            : "bg-white text-ink-900 border border-border rounded-ss-none shadow-card"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap leading-relaxed text-sm font-sans">
            {content}
          </p>
        ) : (
          <div className="group relative">
            <MarkdownRenderer content={content} />

            {/* Copy button for assistant responses */}
            {!isStreaming && content && (
              <div className="flex justify-end pt-1.5 -mb-1">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1 text-[11px] text-ink-400 hover:text-green-700 px-1.5 py-0.5 rounded transition-colors"
                  title={copied ? copiedLabel : copyLabel}
                  aria-label={copied ? copiedLabel : copyLabel}
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-accent-500" />
                      <span className="text-accent-500 font-medium">
                        {copiedLabel}
                      </span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>{copyLabel}</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
