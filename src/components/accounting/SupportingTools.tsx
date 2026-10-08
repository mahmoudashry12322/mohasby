"use client";
import { useState } from "react";
import { RegisterView } from "./RegisterView";
import { DocumentView } from "./DocumentView";
import { AuditView } from "./AuditView";
// Supporting workflows live inside their workbook screen, never as Home tiles.
export function SupportingTools({ tools }: { tools: [string, string][] }) {
  const [open, setOpen] = useState("");
  return (
    <div className="mt-8 space-y-4 print:hidden">
      {tools.map(([id, title]) => (
        <details
          key={id}
          className="rounded-lg border bg-white p-4"
          onToggle={(e) => {
            if (e.currentTarget.open) setOpen(id);
          }}
        >
          <summary className="cursor-pointer font-bold">{title}</summary>
          {open === id && (
            <div className="pt-5">
              {id === "documents" ? (
                <DocumentView />
              ) : id === "audit" ? (
                <AuditView />
              ) : (
                <RegisterView
                  title={title}
                  kind={id === "centers" ? "cost-centers" : "farms"}
                />
              )}
            </div>
          )}
        </details>
      ))}
    </div>
  );
}
