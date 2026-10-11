// Explicit route-to-workflow map; no placeholder routes are counted as implemented.
export type Module = {
  type:
    | "journal"
    | "report"
    | "register"
    | "stock"
    | "calculator"
    | "settings"
    | "audit"
    | "document"
    | "cost"
    | "equity"
    | "payroll";
  kind?: string;
  report?: string;
  view?: string;
  partyType?: string;
  readOnly?: boolean;
  costType?: string;
};
export const modules: Record<string, Module> = {
  employees: { type: "register", kind: "employees" },
  "payroll-journal": { type: "payroll", view: "journal" },
  "payroll-statement": { type: "payroll", view: "statement" },
  payslip: { type: "payroll", view: "payslip" },
  documents: { type: "document" },
  "opening-balances": { type: "journal", kind: "OPENING" },
  "journal-entries": { type: "journal" },
  "general-ledger": { type: "report" },
  "subsidiary-ledger": { type: "report" },
  "account-statement": { type: "report" },
  "trial-balance": { type: "report", report: "trial-balance" },
  "account-reconciliation": { type: "journal", kind: "ADJUSTMENT" },
  "inventory-adjustments": { type: "stock", kind: "COUNT_GAIN" },
  "asset-depreciation": { type: "register", kind: "assets" },
  "depreciation-calculator": { type: "calculator", kind: "depreciation" },
  "income-statement": { type: "report", report: "financial", view: "income" },
  "profit-and-loss": { type: "equity" },
  "balance-sheet": { type: "report", report: "financial" },
  "statement-of-equity": {
    type: "report",
    report: "financial",
    view: "equity",
  },
  "equity-summary": { type: "equity", view: "distribution" },
  "cash-flow-direct": { type: "report", report: "cash-flow" },
  "cash-flow-indirect": { type: "report", report: "cash-flow-indirect" },
  "account-lists": { type: "register", kind: "lookups", view: "account-lists" },
  "lookup-lists": { type: "register", kind: "lookups" },
  "warehouse-journal": { type: "stock" },
  "warehouse-report": { type: "stock", readOnly: true },
  "ending-inventory-report": { type: "stock", readOnly: true },
  "warehouse-waste": { type: "stock", kind: "WASTE" },
  "stock-receipt": { type: "stock", kind: "RECEIPT" },
  "stock-issue": { type: "stock", kind: "ISSUE" },
  "item-card": { type: "stock", readOnly: true },
  "cold-storage-journal": { type: "stock" },
  "cold-storage-report": { type: "stock", readOnly: true, view: "cold" },
  "cold-storages-report": { type: "stock", readOnly: true, view: "cold" },
  "item-report": { type: "stock", readOnly: true, view: "cold" },
  banks: { type: "register", kind: "banks" },
  "bank-transactions": { type: "journal", kind: "CASH" },
  "bank-statement": { type: "report", view: "cash" },
  "bank-reconciliation": { type: "journal", kind: "ADJUSTMENT" },
  treasury: { type: "journal", kind: "CASH" },
  "treasury-report": { type: "report", view: "cash" },
  "cost-journal": { type: "journal" },
  "import-costs": { type: "cost", costType: "IMPORT" },
  "import-calculator": { type: "calculator", kind: "import" },
  "export-costs": { type: "cost", costType: "EXPORT" },
  "farming-costs": { type: "cost", costType: "FARMING" },
  "manufacturing-costs": { type: "cost", costType: "MANUFACTURING" },
  "animal-costs": { type: "cost", costType: "ANIMAL" },
  "cost-centers-report": { type: "report" },
  "daily-report": { type: "report" },
  "sales-report": { type: "report", view: "sales" },
  "purchases-report": { type: "report", view: "purchases" },
  "outstanding-balances-report": { type: "report", report: "parties" },
  customers: { type: "register", kind: "parties", partyType: "CUSTOMER" },
  suppliers: { type: "register", kind: "parties", partyType: "SUPPLIER" },
  partners: { type: "register", kind: "parties", partyType: "PARTNER" },
  items: { type: "register", kind: "items" },
  warehouses: { type: "register", kind: "warehouses" },
  "cost-centers": { type: "register", kind: "cost-centers" },
  "cost-items": { type: "register", kind: "cost-items" },
  farms: { type: "register", kind: "farms" },
  "weigh-ticket": { type: "calculator", kind: "weigh" },
  settings: { type: "settings" },
  "audit-log": { type: "audit" },
};
