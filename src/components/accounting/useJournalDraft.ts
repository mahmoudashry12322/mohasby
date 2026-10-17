"use client";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { api } from "./Workspace";

const draftSchema = z.object({
  date: z.string().max(10),
  description: z.string().max(1000),
  document: z.string().max(200),
  reference: z.string().max(200),
  requestKey: z.string().max(100),
  lines: z
    .array(
      z.object({
        accountCode: z.string(),
        debit: z.string(),
        credit: z.string(),
        description: z.string(),
        party: z.string(),
        costCenter: z.string(),
        costType: z.string(),
        costItem: z.string(),
        season: z.string(),
        farm: z.string(),
        pivot: z.string(),
        cashFlow: z.string(),
      }),
    )
    .min(2)
    .max(500),
});
type Draft = z.infer<typeof draftSchema>;

// Per-tab, per authenticated user. Never restore another user's accounting data.
export function useJournalDraft(
  kind: string,
  draft: Draft,
  restore: (value: Draft) => void,
) {
  const restoreRef = useRef(restore);
  restoreRef.current = restore;
  const [key, setKey] = useState(""),
    [ready, setReady] = useState(false),
    [notice, setNotice] = useState("");
  useEffect(() => {
    let active = true;
    void api("/api/auth/me")
      .then(({ user }) => {
        if (!active) return;
        const storageKey = `mohasby:journal:v1:${user.companyId}:${user.id}:${kind}`;
        try {
          const raw = sessionStorage.getItem(storageKey);
          if (raw) {
            const saved = draftSchema.safeParse(JSON.parse(raw));
            if (saved.success) {
              restoreRef.current(saved.data);
              setNotice(
                "استعدنا الإدخال غير المحفوظ في هذا التبويب. لم يُرحّل إلى الدفاتر.",
              );
            } else sessionStorage.removeItem(storageKey);
          }
          setKey(storageKey);
        } catch {
          setNotice(
            "الحفظ المؤقت في المتصفح غير متاح؛ احتفظ بالصفحة مفتوحة حتى الحفظ.",
          );
        }
      })
      .catch(() => {
        if (active)
          setNotice("تعذر تجهيز الحفظ المؤقت؛ احتفظ بالصفحة مفتوحة حتى الحفظ.");
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, [kind]);
  useEffect(() => {
    if (!key || !ready) return;
    const dirty =
      draft.description.trim() ||
      draft.lines.some(
        (l) => l.accountCode || Number(l.debit) || Number(l.credit),
      );
    try {
      if (dirty) sessionStorage.setItem(key, JSON.stringify(draft));
      else sessionStorage.removeItem(key);
    } catch {
      /* Storage restrictions must never interrupt accounting entry. */
    }
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [draft, key, ready]);
  return { ready, notice, clearNotice: () => setNotice("") };
}
