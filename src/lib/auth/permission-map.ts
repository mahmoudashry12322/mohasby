import { PermissionKey, can, PermissionPrincipal } from "./permissions";

/**
 * Maps page slugs (from workbook-home and navigation routes) to their required view PermissionKey.
 */
export const PAGE_PERMISSION_MAP: Record<string, PermissionKey> = {
  // Accounting group
  "chart-of-accounts": "accounts.view",
  "account-lists": "account_lists.view",
  "opening-balances": "journal.view",
  "journal-entries": "journal.view",
  "general-ledger": "reports.general_ledger",
  "subsidiary-ledger": "reports.subsidiary_ledger",
  "account-statement": "reports.account_statement",
  "trial-balance": "reports.trial_balance",
  "account-reconciliation": "journal.view",
  "inventory-adjustments": "stock.view",
  "asset-depreciation": "assets.view",
  "depreciation-calculator": "depreciation.view",
  "income-statement": "reports.income_statement",
  "profit-and-loss": "equity.view",
  "balance-sheet": "reports.balance_sheet",
  "statement-of-equity": "equity.view",
  "equity-summary": "equity.view",
  "cash-flow-direct": "reports.cash_flow",
  "cash-flow-indirect": "reports.cash_flow",
  "lookup-lists": "lookup_lists.view",
  documents: "documents.view",

  // Warehouses group
  "warehouse-journal": "stock.view",
  "warehouse-report": "stock.view",
  "ending-inventory-report": "stock.view",
  "warehouse-waste": "stock.view",
  "stock-receipt": "stock.view",
  "stock-issue": "stock.view",
  "item-card": "stock.view",

  // Cold storage group
  "cold-storage-journal": "stock.view",
  "cold-storage-report": "stock.view",
  "cold-storages-report": "stock.view",
  "item-report": "stock.view",

  // Banking group
  banks: "banks.view",
  "bank-transactions": "journal.view",
  "bank-statement": "reports.bank_treasury",
  "bank-reconciliation": "journal.view",
  "cheque-portfolio": "journal.view",
  treasury: "journal.view",
  "treasury-report": "reports.bank_treasury",

  // Costs group
  "cost-journal": "journal.view",
  "import-costs": "costs.view",
  "import-calculator": "costs.view",
  "export-costs": "costs.view",
  "farming-costs": "costs.view",
  "manufacturing-costs": "costs.view",
  "animal-costs": "costs.view",

  // Reports group
  "sales-report": "reports.sales_purchases",
  "purchases-report": "reports.sales_purchases",
  "cost-centers-report": "reports.cost_centers",
  "outstanding-balances-report": "reports.outstanding_balances",
  "daily-report": "reports.daily",

  // HR group
  employees: "employees.view",
  "payroll-journal": "payroll.view",
  "payroll-statement": "payroll.view",
  payslip: "payroll.view",

  // Setup group
  customers: "customers.view",
  suppliers: "suppliers.view",
  partners: "partners.view",
  items: "items.view",
  warehouses: "warehouses.view",
  "cost-centers": "cost_centers.view",
  "cost-items": "cost_items.view",
  farms: "farms.view",
  "weigh-ticket": "documents.view",
  settings: "settings.view",
  "audit-log": "audit.view",
};

/**
 * Returns the required PermissionKey to view a given dashboard page.
 */
export function getPagePermission(pageSlug: string): PermissionKey | undefined {
  return PAGE_PERMISSION_MAP[pageSlug];
}

/**
 * Checks if a principal is permitted to access a given dashboard route.
 */
export function canAccessPage(
  user: PermissionPrincipal | null | undefined,
  pageSlug: string,
): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;
  const permission = getPagePermission(pageSlug);
  if (!permission) return true; // If no specific permission is mapped, accessible by authenticated users
  return can(user, permission);
}

/**
 * Maps register kind and party type to view and manage permission keys.
 */
export function getRegisterPermissions(
  kind: string,
  partyType?: string,
): { view: PermissionKey; manage: PermissionKey } {
  switch (kind) {
    case "parties":
      if (partyType === "CUSTOMER") {
        return { view: "customers.view", manage: "customers.manage" };
      }
      if (partyType === "SUPPLIER") {
        return { view: "suppliers.view", manage: "suppliers.manage" };
      }
      if (partyType === "PARTNER") {
        return { view: "partners.view", manage: "partners.manage" };
      }
      return { view: "customers.view", manage: "customers.manage" };
    case "items":
      return { view: "items.view", manage: "items.manage" };
    case "warehouses":
      return { view: "warehouses.view", manage: "warehouses.manage" };
    case "cost-centers":
      return { view: "cost_centers.view", manage: "cost_centers.manage" };
    case "cost-items":
      return { view: "cost_items.view", manage: "cost_items.manage" };
    case "farms":
      return { view: "farms.view", manage: "farms.manage" };
    case "banks":
      return { view: "banks.view", manage: "banks.manage" };
    case "employees":
      return { view: "employees.view", manage: "employees.manage" };
    case "assets":
      return { view: "assets.view", manage: "assets.manage" };
    case "lookups":
      return { view: "lookup_lists.view", manage: "lookup_lists.manage" };
    default:
      return { view: "settings.view", manage: "settings.manage" };
  }
}
