-- AlterTable
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "User" ADD COLUMN "username" TEXT;
ALTER TABLE "User" ADD COLUMN "permissions" JSONB NOT NULL DEFAULT '[]'::jsonb;

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- Backfill usernames for existing users based on email prefix
UPDATE "User"
SET "username" = LOWER(SPLIT_PART("email", '@', 1))
WHERE "username" IS NULL AND "email" IS NOT NULL;

-- Backfill permissions for legacy accountant accounts
UPDATE "User"
SET "permissions" = '[
  "accounts.view", "accounts.create", "accounts.edit",
  "journal.view", "journal.create", "journal.edit", "journal.post", "journal.void", "journal.reverse",
  "documents.view", "documents.create", "documents.post",
  "stock.view", "stock.movement",
  "customers.view", "customers.manage",
  "suppliers.view", "suppliers.manage",
  "partners.view", "partners.manage",
  "items.view", "items.manage",
  "warehouses.view", "warehouses.manage",
  "cost_centers.view", "cost_centers.manage",
  "cost_items.view", "cost_items.manage",
  "farms.view", "farms.manage",
  "banks.view", "banks.manage",
  "account_lists.view", "account_lists.manage",
  "lookup_lists.view", "lookup_lists.manage",
  "employees.view", "employees.manage",
  "payroll.view", "payroll.post",
  "assets.view", "assets.manage", "depreciation.calculate", "depreciation.view",
  "costs.view", "costs.manage",
  "equity.view", "equity.distribute",
  "reports.general_ledger", "reports.subsidiary_ledger", "reports.account_statement",
  "reports.trial_balance", "reports.income_statement", "reports.balance_sheet",
  "reports.cash_flow", "reports.sales_purchases", "reports.cost_centers",
  "reports.outstanding_balances", "reports.daily", "reports.bank_treasury"
]'::jsonb
WHERE "role" = 'accountant' AND "permissions" = '[]'::jsonb;

-- Backfill permissions for legacy auditor accounts (read-only view)
UPDATE "User"
SET "permissions" = '[
  "accounts.view",
  "journal.view",
  "documents.view",
  "stock.view",
  "customers.view",
  "suppliers.view",
  "partners.view",
  "items.view",
  "warehouses.view",
  "cost_centers.view",
  "cost_items.view",
  "farms.view",
  "banks.view",
  "account_lists.view",
  "lookup_lists.view",
  "employees.view",
  "payroll.view",
  "assets.view", "depreciation.view",
  "costs.view",
  "equity.view",
  "reports.general_ledger", "reports.subsidiary_ledger", "reports.account_statement",
  "reports.trial_balance", "reports.income_statement", "reports.balance_sheet",
  "reports.cash_flow", "reports.sales_purchases", "reports.cost_centers",
  "reports.outstanding_balances", "reports.daily", "reports.bank_treasury"
]'::jsonb
WHERE "role" = 'auditor' AND "permissions" = '[]'::jsonb;
