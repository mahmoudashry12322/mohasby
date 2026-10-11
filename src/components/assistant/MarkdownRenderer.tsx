"use client";

import React, { useMemo } from "react";

interface MarkdownRendererProps {
  content: string;
}

/**
 * Lightweight, safe React-based Markdown renderer for assistant messages.
 * Handles:
 *  - Headers (###, ##, #)
 *  - Bold text (**text**)
 *  - Inline code (`code`)
 *  - Ordered list items (1. 2. 3.)
 *  - Unordered list items (- or *)
 *  - Paragraphs with line breaks
 *
 * Avoids heavy external dependencies and dangerouslySetInnerHTML.
 */
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const elements = useMemo(() => {
    if (!content) return null;

    const lines = content.split("\n");
    const result: React.ReactNode[] = [];
    let listBuffer: { type: "ol" | "ul"; items: React.ReactNode[] } | null = null;

    const flushList = (key: string) => {
      if (!listBuffer) return;
      if (listBuffer.type === "ol") {
        result.push(
          <ol
            key={key}
            className="my-2.5 space-y-1.5 ps-5 list-decimal text-ink-900 marker:text-green-700 marker:font-semibold text-sm leading-relaxed"
          >
            {listBuffer.items.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ol>,
        );
      } else {
        result.push(
          <ul
            key={key}
            className="my-2.5 space-y-1.5 ps-5 list-disc text-ink-900 marker:text-accent-500 text-sm leading-relaxed"
          >
            {listBuffer.items.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>,
        );
      }
      listBuffer = null;
    };

    const renderInline = (text: string): React.ReactNode[] => {
      // Tokenize by `code` first, then **bold**
      const parts: React.ReactNode[] = [];
      const codeRegex = /`([^`]+)`/g;
      let lastIdx = 0;
      let match: RegExpExecArray | null;

      while ((match = codeRegex.exec(text)) !== null) {
        if (match.index > lastIdx) {
          parts.push(
            ...renderBold(text.slice(lastIdx, match.index), `sub-${lastIdx}`),
          );
        }
        parts.push(
          <code
            key={`code-${match.index}`}
            className="px-1.5 py-0.5 mx-0.5 rounded bg-green-100 text-green-800 font-mono text-xs font-medium border border-border"
          >
            {match[1]}
          </code>,
        );
        lastIdx = codeRegex.lastIndex;
      }

      if (lastIdx < text.length) {
        parts.push(...renderBold(text.slice(lastIdx), `sub-end`));
      }

      return parts;
    };

    const renderBold = (text: string, prefix: string): React.ReactNode[] => {
      const parts: React.ReactNode[] = [];
      const boldRegex = /\*\*([^*]+)\*\*/g;
      let lastIdx = 0;
      let match: RegExpExecArray | null;

      while ((match = boldRegex.exec(text)) !== null) {
        if (match.index > lastIdx) {
          parts.push(text.slice(lastIdx, match.index));
        }
        parts.push(
          <strong
            key={`${prefix}-bold-${match.index}`}
            className="font-bold text-ink-900"
          >
            {match[1]}
          </strong>,
        );
        lastIdx = boldRegex.lastIndex;
      }

      if (lastIdx < text.length) {
        parts.push(text.slice(lastIdx));
      }

      return parts;
    };

    lines.forEach((line, lineIndex) => {
      const trimmed = line.trim();

      // Empty line -> flush list
      if (!trimmed) {
        flushList(`list-${lineIndex}`);
        return;
      }

      // Headers
      if (trimmed.startsWith("### ")) {
        flushList(`list-${lineIndex}`);
        result.push(
          <h4
            key={`h4-${lineIndex}`}
            className="mt-3.5 mb-1.5 text-sm font-bold text-green-700 font-kufi"
          >
            {renderInline(trimmed.slice(4))}
          </h4>,
        );
        return;
      }
      if (trimmed.startsWith("## ")) {
        flushList(`list-${lineIndex}`);
        result.push(
          <h3
            key={`h3-${lineIndex}`}
            className="mt-4 mb-2 text-base font-bold text-green-800 font-kufi border-b border-border-light pb-1"
          >
            {renderInline(trimmed.slice(3))}
          </h3>,
        );
        return;
      }
      if (trimmed.startsWith("# ")) {
        flushList(`list-${lineIndex}`);
        result.push(
          <h2
            key={`h2-${lineIndex}`}
            className="mt-4 mb-2 text-lg font-bold text-green-900 font-kufi"
          >
            {renderInline(trimmed.slice(2))}
          </h2>,
        );
        return;
      }

      // Ordered list (1. 2. 3.)
      const olMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
      if (olMatch) {
        if (listBuffer && listBuffer.type !== "ol") {
          flushList(`list-${lineIndex}`);
        }
        if (!listBuffer) {
          listBuffer = { type: "ol", items: [] };
        }
        listBuffer.items.push(renderInline(olMatch[2]));
        return;
      }

      // Unordered list (- or *)
      const ulMatch = trimmed.match(/^[-*]\s+(.+)$/);
      if (ulMatch) {
        if (listBuffer && listBuffer.type !== "ul") {
          flushList(`list-${lineIndex}`);
        }
        if (!listBuffer) {
          listBuffer = { type: "ul", items: [] };
        }
        listBuffer.items.push(renderInline(ulMatch[1]));
        return;
      }

      // Blockquote (> )
      if (trimmed.startsWith("> ")) {
        flushList(`list-${lineIndex}`);
        result.push(
          <div
            key={`quote-${lineIndex}`}
            className="my-2 p-2.5 rounded-input bg-canvas border-s-4 border-accent-500 text-ink-600 text-xs leading-relaxed"
          >
            {renderInline(trimmed.slice(2))}
          </div>,
        );
        return;
      }

      // Normal paragraph line
      flushList(`list-${lineIndex}`);
      result.push(
        <p
          key={`p-${lineIndex}`}
          className="my-1.5 text-sm text-ink-900 leading-relaxed"
        >
          {renderInline(trimmed)}
        </p>,
      );
    });

    flushList("final-list");
    return result;
  }, [content]);

  return <div className="space-y-1">{elements}</div>;
};
