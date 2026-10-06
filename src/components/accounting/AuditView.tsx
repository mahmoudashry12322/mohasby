"use client";
import React, { useState } from "react";
import { DataTable, useLoad, Workspace } from "./Workspace";
export function AuditView() {
  const [page, setPage] = useState(1);
  const { data, error } = useLoad<{
    rows: Record<string, unknown>[];
    total: number;
  }>("/api/audit?page=" + page, { rows: [], total: 0 });
  return (
    <Workspace title="سجل المراجعة" error={error}>
      <DataTable
        rows={data.rows.map((r) => ({
          ...r,
          detail: JSON.stringify(r.detail),
        }))}
        columns={[
          ["createdAt", "الوقت"],
          ["userId", "المستخدم"],
          ["action", "الإجراء"],
          ["entityId", "المرجع"],
          ["detail", "التفاصيل"],
        ].map(([key, label]) => ({ key, label }))}
      />
      <div className="flex gap-4">
        <button disabled={page === 1} onClick={() => setPage(page - 1)}>
          السابق
        </button>
        <span>{page}</span>
        <button
          disabled={page * 100 >= data.total}
          onClick={() => setPage(page + 1)}
        >
          التالي
        </button>
      </div>
    </Workspace>
  );
}
