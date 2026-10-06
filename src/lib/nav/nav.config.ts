import { modules } from "@/lib/accounting/modules";
export type NavItem = {
  key: string;
  slug: string;
  icon?: never;
  labelKey: string;
  descriptionKey: string;
  permission?: string;
  cluster?: number;
};

export type NavGroup = {
  key: string;
  slug: string;
  icon: string;
  labelKey: string;
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    key: "accounting",
    slug: "accounting",
    icon: "accounting",
    labelKey: "accounting",
    items: [
      // Cluster 1: Structure & Openings
      {
        key: "chart-of-accounts",
        slug: "chart-of-accounts",
        labelKey: "chartOfAccounts",
        descriptionKey: "chartOfAccountsDesc",
        cluster: 1,
      },
      {
        key: "opening-balances",
        slug: "opening-balances",
        labelKey: "openingBalances",
        descriptionKey: "openingBalancesDesc",
        cluster: 1,
      },
      {
        key: "journal-entries",
        slug: "journal-entries",
        labelKey: "journalEntries",
        descriptionKey: "journalEntriesDesc",
        cluster: 1,
      },

      // Cluster 2: Ledger & Audits
      {
        key: "general-ledger",
        slug: "general-ledger",
        labelKey: "generalLedger",
        descriptionKey: "generalLedgerDesc",
        cluster: 2,
      },
      {
        key: "account-statement",
        slug: "account-statement",
        labelKey: "accountStatement",
        descriptionKey: "accountStatementDesc",
        cluster: 2,
      },
      {
        key: "trial-balance",
        slug: "trial-balance",
        labelKey: "trialBalance",
        descriptionKey: "trialBalanceDesc",
        cluster: 2,
      },
      {
        key: "account-reconciliation",
        slug: "account-reconciliation",
        labelKey: "accountReconciliation",
        descriptionKey: "accountReconciliationDesc",
        cluster: 2,
      },
      {
        key: "inventory-adjustments",
        slug: "inventory-adjustments",
        labelKey: "inventoryAdjustments",
        descriptionKey: "inventoryAdjustmentsDesc",
        cluster: 2,
      },
      {
        key: "asset-depreciation",
        slug: "asset-depreciation",
        labelKey: "assetDepreciation",
        descriptionKey: "assetDepreciationDesc",
        cluster: 2,
      },

      // Cluster 3: Statements & Performance
      {
        key: "income-statement",
        slug: "income-statement",
        labelKey: "incomeStatement",
        descriptionKey: "incomeStatementDesc",
        cluster: 3,
      },
      {
        key: "profit-and-loss",
        slug: "profit-and-loss",
        labelKey: "profitAndLoss",
        descriptionKey: "profitAndLossDesc",
        cluster: 3,
      },
      {
        key: "balance-sheet",
        slug: "balance-sheet",
        labelKey: "balanceSheet",
        descriptionKey: "balanceSheetDesc",
        cluster: 3,
      },
      {
        key: "statement-of-equity",
        slug: "statement-of-equity",
        labelKey: "statementOfEquity",
        descriptionKey: "statementOfEquityDesc",
        cluster: 3,
      },
      {
        key: "cash-flow-direct",
        slug: "cash-flow-direct",
        labelKey: "cashFlowDirect",
        descriptionKey: "cashFlowDirectDesc",
        cluster: 3,
      },
      {
        key: "cash-flow-indirect",
        slug: "cash-flow-indirect",
        labelKey: "cashFlowIndirect",
        descriptionKey: "cashFlowIndirectDesc",
        cluster: 3,
      },

      // Cluster 4: Lookups
      {
        key: "account-lists",
        slug: "account-lists",
        labelKey: "accountLists",
        descriptionKey: "accountListsDesc",
        cluster: 4,
      },
      {
        key: "lookup-lists",
        slug: "lookup-lists",
        labelKey: "lookupLists",
        descriptionKey: "lookupListsDesc",
        cluster: 4,
      },
    ],
  },
  {
    key: "warehouses",
    slug: "warehouses",
    icon: "warehouses",
    labelKey: "warehouses",
    items: [
      {
        key: "warehouse-journal",
        slug: "warehouse-journal",
        labelKey: "warehouseJournal",
        descriptionKey: "warehouseJournalDesc",
      },
      {
        key: "warehouse-report",
        slug: "warehouse-report",
        labelKey: "warehouseReport",
        descriptionKey: "warehouseReportDesc",
      },
      {
        key: "ending-inventory-report",
        slug: "ending-inventory-report",
        labelKey: "endingInventoryReport",
        descriptionKey: "endingInventoryReportDesc",
      },
      {
        key: "warehouse-waste",
        slug: "warehouse-waste",
        labelKey: "warehouseWaste",
        descriptionKey: "warehouseWasteDesc",
      },
    ],
  },
  {
    key: "cold-storage",
    slug: "cold-storage",
    icon: "cold-storage",
    labelKey: "coldStorage",
    items: [
      {
        key: "cold-storage-journal",
        slug: "cold-storage-journal",
        labelKey: "coldStorageJournal",
        descriptionKey: "coldStorageJournalDesc",
      },
      {
        key: "cold-storage-report",
        slug: "cold-storage-report",
        labelKey: "coldStorageReport",
        descriptionKey: "coldStorageReportDesc",
      },
      {
        key: "cold-storages-report",
        slug: "cold-storages-report",
        labelKey: "coldStoragesReport",
        descriptionKey: "coldStoragesReportDesc",
      },
      {
        key: "item-report",
        slug: "item-report",
        labelKey: "itemReport",
        descriptionKey: "itemReportDesc",
      },
    ],
  },
  {
    key: "banking",
    slug: "banking",
    icon: "banking",
    labelKey: "banking",
    items: [
      {
        key: "banks",
        slug: "banks",
        labelKey: "banks",
        descriptionKey: "banksDesc",
      },
      {
        key: "bank-transactions",
        slug: "bank-transactions",
        labelKey: "bankTransactions",
        descriptionKey: "bankTransactionsDesc",
      },
      {
        key: "bank-statement",
        slug: "bank-statement",
        labelKey: "bankStatement",
        descriptionKey: "bankStatementDesc",
      },
      {
        key: "bank-reconciliation",
        slug: "bank-reconciliation",
        labelKey: "bankReconciliation",
        descriptionKey: "bankReconciliationDesc",
      },
      {
        key: "cheque-portfolio",
        slug: "cheque-portfolio",
        labelKey: "chequePortfolio",
        descriptionKey: "chequePortfolioDesc",
      },
    ],
  },
  {
    key: "costs",
    slug: "costs",
    icon: "costs",
    labelKey: "costs",
    items: [
      {
        key: "cost-journal",
        slug: "cost-journal",
        labelKey: "costJournal",
        descriptionKey: "costJournalDesc",
      },
      {
        key: "import-costs",
        slug: "import-costs",
        labelKey: "importCosts",
        descriptionKey: "importCostsDesc",
      },
      {
        key: "export-costs",
        slug: "export-costs",
        labelKey: "exportCosts",
        descriptionKey: "exportCostsDesc",
      },
      {
        key: "farming-costs",
        slug: "farming-costs",
        labelKey: "farmingCosts",
        descriptionKey: "farmingCostsDesc",
      },
      {
        key: "manufacturing-costs",
        slug: "manufacturing-costs",
        labelKey: "manufacturingCosts",
        descriptionKey: "manufacturingCostsDesc",
      },
    ],
  },
  {
    key: "reports",
    slug: "reports",
    icon: "reports",
    labelKey: "reports",
    items: [
      {
        key: "sales-report",
        slug: "sales-report",
        labelKey: "salesReport",
        descriptionKey: "salesReportDesc",
      },
      {
        key: "purchases-report",
        slug: "purchases-report",
        labelKey: "purchasesReport",
        descriptionKey: "purchasesReportDesc",
      },
      {
        key: "cost-centers-report",
        slug: "cost-centers-report",
        labelKey: "costCentersReport",
        descriptionKey: "costCentersReportDesc",
      },
      {
        key: "outstanding-balances-report",
        slug: "outstanding-balances-report",
        labelKey: "outstandingBalancesReport",
        descriptionKey: "outstandingBalancesReportDesc",
      },
    ],
  },
  {
    key: "hr",
    slug: "hr",
    icon: "hr",
    labelKey: "hr",
    items: [
      {
        key: "employees",
        slug: "employees",
        labelKey: "employees",
        descriptionKey: "employeesDesc",
      },
      {
        key: "payroll-journal",
        slug: "payroll-journal",
        labelKey: "payrollJournal",
        descriptionKey: "payrollJournalDesc",
      },
      {
        key: "payroll-statement",
        slug: "payroll-statement",
        labelKey: "payrollStatement",
        descriptionKey: "payrollStatementDesc",
      },
    ],
  },
  {
    key: "setup",
    slug: "setup",
    icon: "setup",
    labelKey: "setup",
    items: [
      {
        key: "customers",
        slug: "customers",
        labelKey: "customers",
        descriptionKey: "customersDesc",
      },
      {
        key: "suppliers",
        slug: "suppliers",
        labelKey: "suppliers",
        descriptionKey: "suppliersDesc",
      },
    ],
  },
];

const additions: Record<string, [string, string, string][]> = {
  accounting: [
    ["documents", "documents", "المبيعات والمشتريات"],
    ["subsidiary-ledger", "subsidiaryLedger", "الأستاذ المساعد"],
    ["equity-summary", "equitySummary", "ملخص حقوق الملكية"],
    ["depreciation-calculator", "depreciationCalculator", "حاسبة الإهلاك"],
  ],
  warehouses: [
    ["stock-receipt", "stockReceipt", "إذن إضافة"],
    ["stock-issue", "stockIssue", "إذن صرف"],
    ["item-card", "itemCard", "كارتة صنف"],
  ],
  banking: [
    ["treasury", "treasury", "حركة الخزينة"],
    ["treasury-report", "treasuryReport", "تقرير حركة الخزينة"],
  ],
  costs: [
    ["animal-costs", "animalCosts", "تكاليف الإنتاج الحيواني"],
    ["import-calculator", "importCalculator", "حاسبة تكلفة الاستيراد"],
  ],
  reports: [["daily-report", "dailyReport", "تقارير اليومية"]],
  setup: [
    ["partners", "partners", "الشركاء"],
    ["items", "items", "دليل الأصناف"],
    ["warehouses", "warehouseDirectory", "دليل المخازن"],
    ["cost-centers", "costCenters", "مراكز التكلفة"],
    ["cost-items", "costItems", "دليل التكاليف"],
    ["farms", "farms", "المزارع"],
    ["weigh-ticket", "weighTicket", "حاسبة الوزن والخصومات"],
    ["settings", "settings", "إعدادات الشركة"],
    ["audit-log", "auditLog", "سجل المراجعة"],
  ],
};
for (const group of NAV_GROUPS) {
  for (const [slug, labelKey] of additions[group.slug] || [])
    group.items.push({
      key: slug,
      slug,
      labelKey,
      descriptionKey: labelKey + "Desc",
    });
  group.items = group.items.filter(
    (item) => item.slug === "chart-of-accounts" || !!modules[item.slug],
  );
}
for (let i = NAV_GROUPS.length - 1; i >= 0; i--)
  if (!NAV_GROUPS[i].items.length) NAV_GROUPS.splice(i, 1);

export function getNavGroup(groupSlug: string): NavGroup | undefined {
  return NAV_GROUPS.find((g) => g.slug === groupSlug);
}

export function getNavItem(
  groupSlug: string,
  pageSlug: string,
): { group: NavGroup; item: NavItem } | undefined {
  const group = getNavGroup(groupSlug);
  if (!group) return undefined;
  const item = group.items.find((i) => i.slug === pageSlug);
  if (!item) return undefined;
  return { group, item };
}

export function getAllNavItems(): Array<{ group: NavGroup; item: NavItem }> {
  const result: Array<{ group: NavGroup; item: NavItem }> = [];
  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      result.push({ group, item });
    }
  }
  return result;
}

export function getAllRouteParams(): Array<{ group: string; page: string }> {
  return getAllNavItems().map(({ group, item }) => ({
    group: group.slug,
    page: item.slug,
  }));
}
