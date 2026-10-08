"use client";
import { useState } from "react";
import { DataTable, Field, inputClass, useLoad, Workspace } from "./Workspace";
import { RegisterView } from "./RegisterView";
import lookups from "@/data/workbook-lookups.json";

type Account = {
  code: string;
  name: string;
  parentCode: string | null;
  accountClass: string;
  isGroup: boolean;
};
type Person = { code: string; name: string; data: Record<string, string> };
// The workbook's lookup sheet is distinct from the editable chart of accounts.
export function AccountListsView({ title }: { title: string }) {
  const accounts = useLoad<{ accounts: Account[] }>("/api/accounts?flat=true", {
    accounts: [],
  });
  const parties = useLoad<{ rows: Person[] }>("/api/registers/parties", {
    rows: [],
  });
  const employees = useLoad<{ rows: Person[] }>("/api/registers/employees", {
    rows: [],
  });
  const [classification, setClassification] = useState("");
  const all = accounts.data.accounts;
  function parents(account: Account) {
    const names: string[] = [],
      seen = new Set<string>([account.code]);
    let parent = all.find((a) => a.code === account.parentCode);
    while (parent && !seen.has(parent.code)) {
      seen.add(parent.code);
      names.unshift(parent.name);
      parent = all.find((a) => a.code === parent!.parentCode);
    }
    return names.join(" / ");
  }
  return (
    <Workspace
      title={title}
      error={accounts.error || parties.error || employees.error}
    >
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <h2 className="font-bold mb-3">التصنيف</h2>
          <DataTable
            rows={lookups.classifications.map((value) => ({ value }))}
            columns={[{ key: "value", label: "التصنيف" }]}
          />
        </div>
        <div>
          <h2 className="font-bold mb-3">المستند</h2>
          <DataTable
            rows={lookups.documents.map((value) => ({ value }))}
            columns={[{ key: "value", label: "المستند" }]}
          />
        </div>
      </div>
      <Field label="الحساب الرئيسي">
        <select
          className={inputClass}
          value={classification}
          onChange={(e) => setClassification(e.target.value)}
        >
          <option value="">الكل</option>
          {[...new Set(all.map((a) => a.accountClass))].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </Field>
      <DataTable
        rows={all
          .filter((a) => !classification || a.accountClass === classification)
          .map((a) => ({
            ...a,
            path: parents(a),
            level: a.isGroup ? "حساب تجميعي" : "حساب تفصيلي",
          }))}
        columns={[
          { key: "accountClass", label: "التصنيف" },
          { key: "path", label: "الحسابات الرئيسية والفرعية" },
          { key: "code", label: "الكود" },
          { key: "name", label: "الحساب" },
          { key: "level", label: "المستوى" },
        ]}
      />
      <h2 className="font-bold">الأطراف والموظفون</h2>
      <DataTable
        rows={[
          ...parties.data.rows.map((p) => ({
            code: p.code,
            name: p.name,
            type: (
              {
                CUSTOMER: "العملاء",
                SUPPLIER: "الموردين",
                PARTNER: "الشركاء",
              } as Record<string, string>
            )[p.data.type],
            account: p.data.accountCode,
          })),
          ...employees.data.rows.map((p) => ({
            code: p.code,
            name: p.name,
            type: "الموظفون",
            account: p.data.advanceAccount,
          })),
        ]}
        columns={[
          { key: "type", label: "القائمة" },
          { key: "code", label: "الكود" },
          { key: "name", label: "الاسم" },
          { key: "account", label: "الحساب المرتبط" },
        ]}
      />
      <details className="rounded-lg border p-4">
        <summary className="cursor-pointer font-bold">
          التصنيفات والقوائم المساعدة
        </summary>
        <div className="pt-5">
          <RegisterView title="التصنيفات والقوائم المساعدة" kind="lookups" />
        </div>
      </details>
    </Workspace>
  );
}
