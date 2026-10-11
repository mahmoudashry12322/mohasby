"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  X,
  Send,
  Square,
  RotateCcw,
  Maximize2,
  Minimize2,
  Bot,
  AlertCircle,
  ShieldAlert,
} from "lucide-react";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { SuggestedChips } from "./SuggestedChips";

interface AssistantChatProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
  locale?: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export const AssistantChat: React.FC<AssistantChatProps> = ({
  isOpen,
  onClose,
  userRole = "admin",
  locale = "ar",
}) => {
  const t = useTranslations("assistant");
  const pathname = usePathname() || "";

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Suggested questions list
  const suggestedQuestions = [
    t("suggested1"),
    t("suggested2"),
    t("suggested3"),
    t("suggested4"),
  ];

  // Auto-scroll helper
  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
    });
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        textareaRef.current?.focus();
        scrollToBottom(false);
      }, 100);
    }
  }, [isOpen, scrollToBottom]);

  useEffect(() => {
    if (isStreaming) {
      scrollToBottom(true);
    }
  }, [messages, isStreaming, scrollToBottom]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  };

  const handleClearChat = () => {
    handleStop();
    setMessages([]);
    setError(null);
  };

  const handleSend = async (textToSend?: string) => {
    const messageText = (textToSend !== undefined ? textToSend : input).trim();
    if (!messageText || isStreaming) return;

    setInput("");
    setError(null);

    const userMsg: Message = { role: "user", content: messageText };
    // Build history from current messages (last 6 to save tokens and context)
    const historyPayload = messages.slice(-6).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    setMessages((prev) => [...prev, userMsg]);
    setIsStreaming(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const res = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageText,
          history: historyPayload,
          currentRoute: pathname,
          locale: locale.startsWith("en") ? "en" : "ar",
        }),
        signal: abortController.signal,
      });

      if (!res.ok) {
        let errMessage = t("errorGeneric");
        try {
          const errData = await res.json();
          if (errData.error) errMessage = errData.error;
        } catch {
          // Keep generic message
        }
        throw new Error(errMessage);
      }

      if (!res.body) {
        throw new Error("No response body received");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";
      let streamFinished = false;

      while (!streamFinished) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;
          const data = trimmed.slice(6);

          if (data === "[DONE]") {
            streamFinished = true;
            break;
          }

          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              throw new Error(parsed.error);
            }
            if (parsed.text) {
              accumulated += parsed.text;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last && last.role === "assistant") {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    ...last,
                    content: accumulated,
                  };
                  return updated;
                }
                return [...prev, { role: "assistant", content: accumulated }];
              });
            }
          } catch (jsonErr: unknown) {
            if (
              jsonErr instanceof Error &&
              jsonErr.message !== "Unexpected end of JSON input"
            ) {
              throw jsonErr;
            }
          }
        }
      }

      if (!accumulated && !abortController.signal.aborted) {
        throw new Error(t("errorGeneric"));
      }
    } catch (err: unknown) {
      if (!abortController.signal.aborted) {
        const errMsg =
          err instanceof Error ? err.message : t("errorGeneric");
        setError(errMsg);
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={chatContainerRef}
      role="dialog"
      aria-label={t("title")}
      aria-modal="false"
      className={`fixed bottom-0 end-0 sm:bottom-6 sm:end-6 z-40 flex flex-col bg-white border border-border sm:rounded-panel shadow-elevated overflow-hidden transition-all duration-300 ease-ledger print:hidden ${
        isExpanded
          ? "w-full sm:w-[620px] h-[95vh] sm:h-[680px]"
          : "w-full sm:w-[420px] h-[92vh] sm:h-[580px]"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-green-900 via-green-800 to-green-700 text-white select-none">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative w-8 h-8 rounded-full bg-accent-500/20 border border-accent-400/30 flex items-center justify-center shrink-0">
            <Bot className="w-4 h-4 text-accent-400" />
            <span
              className="absolute -top-0.5 -end-0.5 w-2 h-2 rounded-full bg-accent-400 ring-2 ring-green-900 animate-pulse"
              aria-hidden="true"
            />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold font-kufi truncate leading-tight">
              {t("title")}
            </h2>
            <p className="text-[11px] text-green-100/70 truncate leading-tight">
              {t("subtitle")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Clear chat button */}
          {messages.length > 0 && (
            <button
              type="button"
              onClick={handleClearChat}
              className="p-1.5 rounded-chip text-green-100/70 hover:text-white hover:bg-white/10 transition-colors"
              title={t("clearChat")}
              aria-label={t("clearChat")}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Expand/Collapse (desktop only) */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="hidden sm:inline-flex p-1.5 rounded-chip text-green-100/70 hover:text-white hover:bg-white/10 transition-colors"
            title={isExpanded ? t("minimize") : t("expand")}
            aria-label={isExpanded ? t("minimize") : t("expand")}
          >
            {isExpanded ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-chip text-green-100/70 hover:text-white hover:bg-white/10 transition-colors"
            title={t("closeAria")}
            aria-label={t("closeAria")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Guide notice pill */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-canvas border-b border-border text-[11px] text-ink-600">
        <ShieldAlert className="w-3.5 h-3.5 text-warning shrink-0" />
        <span className="truncate">{t("guideNotice")}</span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-canvas/30">
        {messages.length === 0 ? (
          <div className="py-6 px-2 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-accent-subtle flex items-center justify-center text-accent-500 mb-3">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-ink-900 font-kufi">
              {t("emptyStateTitle")}
            </h3>
            <p className="text-xs text-ink-600 mt-1 mb-4">
              {t("emptyStateSubtitle")}
            </p>
            <SuggestedChips
              chips={suggestedQuestions}
              onSelect={(chip) => handleSend(chip)}
              disabled={isStreaming}
            />
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => (
              <MessageBubble
                key={idx}
                role={msg.role}
                content={msg.content}
                isStreaming={
                  isStreaming &&
                  idx === messages.length - 1 &&
                  msg.role === "assistant"
                }
                copyLabel={t("copy")}
                copiedLabel={t("copied")}
              />
            ))}

            {isStreaming &&
              messages[messages.length - 1]?.role === "user" && (
                <div className="my-2">
                  <TypingIndicator label={t("typing")} />
                </div>
              )}
          </>
        )}

        {/* Error banner */}
        {error && (
          <div
            className="flex items-start gap-2 p-3 my-2 rounded-card bg-danger/10 border border-danger/30 text-danger text-xs"
            role="alert"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p>{error}</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-3 bg-white border-t border-border">
        <div className="relative flex items-end gap-2 bg-canvas rounded-card p-1.5 border border-border focus-within:border-accent-500 focus-within:ring-1 focus-within:ring-accent-500 transition-all">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            rows={1}
            placeholder={t("inputPlaceholder")}
            className="flex-1 bg-transparent border-0 resize-none px-2.5 py-1.5 text-xs sm:text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none min-h-[38px] max-h-[120px] leading-relaxed"
          />

          {isStreaming ? (
            <button
              type="button"
              onClick={handleStop}
              className="p-2 rounded-btn bg-danger text-white hover:bg-danger/90 transition-colors shrink-0 shadow-sm"
              title={t("stop")}
              aria-label={t("stop")}
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleSend()}
              disabled={!input.trim()}
              className="p-2 rounded-btn bg-green-700 text-white hover:bg-green-800 disabled:opacity-40 disabled:hover:bg-green-700 transition-colors shrink-0 shadow-sm"
              title={t("send")}
              aria-label={t("send")}
            >
              <Send className="w-4 h-4 rtl:-scale-x-100" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
