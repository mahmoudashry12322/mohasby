"use client";
import React from "react";

/** A real table of inputs: natural Tab order, Enter moves down the column.
 * No automatic submit on Enter while the user is entering a cell. */
export function EntrySheet({
  children,
  label,
  compact = false,
  fitScreen = true,
}: {
  children: React.ReactNode;
  label: string;
  compact?: boolean;
  fitScreen?: boolean;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-ink-600 print:hidden flex flex-wrap items-center justify-between gap-2">
        <span>
          الخلايا البيضاء للإدخال، والمظللة نتائج محسوبة. Tab للتنقل، وEnter للسطر التالي.
        </span>
        {fitScreen && (
          <span className="text-[11px] text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200/60 font-medium">
            ✓ وضع ملاءمة الشاشة نشط (بدون تمرير)
          </span>
        )}
      </p>
      <div
        className={`max-w-full rounded-lg border border-green-200 focus-within:border-green-700 ${
          fitScreen ? "overflow-x-auto lg:overflow-x-visible" : "overflow-x-auto"
        }`}
        tabIndex={0}
        role="region"
        aria-label={label}
        onKeyDown={(e) => {
          if (
            e.key !== "Enter" ||
            e.nativeEvent.isComposing ||
            !(e.target instanceof HTMLInputElement)
          )
            return;
          e.preventDefault();
          const cell = e.target.closest("td"),
            row = cell?.parentElement;
          if (!cell || !row) return;
          const next = (
            e.shiftKey ? row.previousElementSibling : row.nextElementSibling
          )?.children[cell.cellIndex];
          const control = next?.querySelector<
            HTMLInputElement | HTMLSelectElement
          >("input:not([readonly]):not([disabled]), select:not([disabled])");
          control?.focus();
          if (control instanceof HTMLInputElement && control.type === "text")
            control.select();
        }}
      >
        <table
          className={`entry-sheet w-full border-collapse text-right text-sm ${
            compact || fitScreen ? "compact-sheet" : ""
          }`}
          aria-label={label}
        >
          {children}
        </table>
      </div>
    </div>
  );
}

// Converts a group of labelled controls into a single spreadsheet entry row.
export function EntryRow({
  children,
  label = "صف إدخال البيانات",
}: {
  children: React.ReactNode;
  label?: string;
}) {
  const cells = React.Children.toArray(children).filter(
    React.isValidElement,
  ) as React.ReactElement<{ label?: string }>[];
  return (
    <EntrySheet label={label}>
      <thead>
        <tr>
          {cells.map((cell, i) => (
            <th key={cell.key ?? i} scope="col">
              {cell.props.label || "البيانات"}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        <tr>
          {cells.map((cell, i) => (
            <td key={cell.key ?? i} className="min-w-40 [&_label>span]:sr-only">
              {cell}
            </td>
          ))}
        </tr>
      </tbody>
    </EntrySheet>
  );
}
