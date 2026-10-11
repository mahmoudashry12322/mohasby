import type { RegisterKind } from "./registers";
export const registerFields: Record<
  RegisterKind,
  { key: string; label: string; type?: string; options?: string[] }[]
> = {
  employees: [
    { key: "job", label: "الوظيفة" },
    { key: "basicSalary", label: "الاساسى", type: "number" },
    { key: "startDate", label: "بداية العمل", type: "date" },
    { key: "phone", label: "موبايل" },
    { key: "address", label: "الاقامة" },
    { key: "notes", label: "ملاحظات" },
    { key: "advanceAccount", label: "حساب سلف الموظفين" },
    { key: "expenseAccount", label: "حساب مصروف المرتب" },
    { key: "payableAccount", label: "حساب المرتبات المستحقة" },
    { key: "insuranceAccount", label: "حساب التأمينات المستحقة" },
  ],
  parties: [
    {
      key: "type",
      label: "النوع",
      options: ["CUSTOMER", "SUPPLIER", "PARTNER"],
    },
    { key: "accountCode", label: "كود الحساب التفصيلي" },
    { key: "phone", label: "الهاتف" },
    { key: "address", label: "العنوان" },
    { key: "taxNumber", label: "الرقم الضريبي" },
    { key: "share", label: "نسبة الشريك (0–1)", type: "number" },
  ],
  items: [
    { key: "category", label: "التصنيف" },
    { key: "unit", label: "الوحدة", options: ["kg", "unit", "tonne"] },
    { key: "inventoryAccount", label: "كود حساب المخزون" },
    { key: "purchaseAccount", label: "كود حساب المشتريات" },
    { key: "expenseAccount", label: "كود حساب تغير المخزون (تكلفة المبيعات)" },
    { key: "salesAccount", label: "كود حساب المبيعات" },
  ],
  warehouses: [
    { key: "type", label: "النوع", options: ["WAREHOUSE", "COLD_STORAGE"] },
    { key: "parent", label: "المخزن الرئيسي" },
    { key: "address", label: "العنوان" },
  ],
  "cost-centers": [
    {
      key: "type",
      label: "النشاط",
      options: ["FARMING", "IMPORT", "EXPORT", "MANUFACTURING", "ANIMAL"],
    },
    { key: "parent", label: "المركز الرئيسي" },
    { key: "season", label: "الموسم" },
    { key: "farm", label: "المزرعة" },
    { key: "pivot", label: "البيفت" },
  ],
  "cost-items": [
    { key: "type", label: "توجيه التكاليف" },
    { key: "parent", label: "البند الرئيسي" },
  ],
  farms: [
    { key: "area", label: "المساحة", type: "number" },
    { key: "pivot", label: "البيفت" },
    { key: "season", label: "الموسم" },
  ],
  assets: [
    { key: "acquired", label: "تاريخ الشراء", type: "date" },
    { key: "cost", label: "قيمة الأصل", type: "number" },
    { key: "additions", label: "الإضافات", type: "number" },
    { key: "priorDepreciation", label: "إهلاك سابق", type: "number" },
    { key: "rate", label: "النسبة السنوية (0–1)", type: "number" },
    { key: "residual", label: "القيمة المتبقية", type: "number" },
    { key: "expenseAccount", label: "كود حساب مصروف الإهلاك" },
    { key: "accumulatedAccount", label: "كود حساب مجمع الإهلاك" },
  ],
  banks: [
    { key: "accountCode", label: "كود حساب البنك / الخزينة" },
    { key: "iban", label: "IBAN" },
    { key: "currency", label: "العملة" },
  ],
  lookups: [
    { key: "category", label: "الفئة" },
    { key: "value", label: "القيمة" },
  ],
};
