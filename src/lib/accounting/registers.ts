import { z } from "zod";
import { dateOnly, decimal } from "./ledger";

const text = z.string().trim().max(250).default("");
export const registerSchemas = {
  employees: z.object({
    job: text,
    basicSalary: decimal,
    startDate: z.union([dateOnly, z.literal("")]).default(""),
    phone: text,
    address: text,
    notes: text,
    advanceAccount: text,
    expenseAccount: text,
    payableAccount: text,
    insuranceAccount: text,
  }),
  parties: z.object({
    type: z.enum(["CUSTOMER", "SUPPLIER", "PARTNER"]),
    phone: text,
    address: text,
    taxNumber: text,
    accountCode: text,
    share: decimal
      .refine((v) => Number(v) <= 1, "النسبة من صفر إلى واحد")
      .default("0"),
  }),
  items: z.object({
    category: text,
    unit: z.enum(["kg", "unit", "tonne"]).default("kg"),
    inventoryAccount: text,
    purchaseAccount: text,
    expenseAccount: text,
    salesAccount: text,
  }),
  warehouses: z.object({
    type: z.enum(["WAREHOUSE", "COLD_STORAGE"]).default("WAREHOUSE"),
    parent: text,
    address: text,
  }),
  "cost-centers": z.object({
    type: z.enum(["FARMING", "IMPORT", "EXPORT", "MANUFACTURING", "ANIMAL"]),
    parent: text,
    season: text,
    farm: text,
    pivot: text,
  }),
  "cost-items": z.object({ type: text, parent: text }),
  farms: z.object({ area: decimal.default("0"), pivot: text, season: text }),
  assets: z.object({
    acquired: dateOnly,
    cost: decimal,
    additions: decimal.default("0"),
    priorDepreciation: decimal.default("0"),
    rate: decimal,
    residual: decimal.default("0"),
    expenseAccount: text,
    accumulatedAccount: text,
  }),
  banks: z.object({
    accountCode: z.string().min(1).max(50),
    iban: text,
    currency: z.string().length(3).default("EGP"),
  }),
  lookups: z.object({ category: text, value: text }),
};
export type RegisterKind = keyof typeof registerSchemas;
export const registerBase = z.object({
  code: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(250),
  isActive: z.boolean().default(true),
  version: z.number().int().positive().optional(),
  data: z.record(z.unknown()),
});
