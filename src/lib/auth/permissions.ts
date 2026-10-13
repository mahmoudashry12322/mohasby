// Pure permissions definitions, types and client-safe helper functions.
// For server-side enforcement, import requirePermission from "@/lib/auth/permissions.server".

export const PERMISSION_DEFINITIONS = [
  // 1. الحسابات
  {
    key: "accounts.view",
    label: "دليل الحسابات — عرض",
    category: "الحسابات وشجرة الحسابات",
    description: "عرض دليل الحسابات وأرصدتها وشجرتها المحاسبية",
  },
  {
    key: "accounts.create",
    label: "دليل الحسابات — إضافة حساب",
    category: "الحسابات وشجرة الحسابات",
    description: "إضافة حسابات فرعية جديدة في الشجرة المحاسبية",
    dependsOn: "accounts.view",
  },
  {
    key: "accounts.edit",
    label: "دليل الحسابات — تعديل حساب",
    category: "الحسابات وشجرة الحسابات",
    description: "تعديل بيانات الحسابات وتصنيف التدفقات النقدية",
    dependsOn: "accounts.view",
  },

  // 2. القيود واليومية
  {
    key: "journal.view",
    label: "قيود اليومية — عرض",
    category: "القيود واليومية العامة",
    description: "عرض قيود اليومية العامة والأرصدة الافتتاحية وحركات الخزينة والتسويات",
  },
  {
    key: "journal.create",
    label: "قيود اليومية — إضافة مسودة",
    category: "القيود واليومية العامة",
    description: "إنشاء مسودة قيد جديد دون ترحيله",
    dependsOn: "journal.view",
  },
  {
    key: "journal.edit",
    label: "قيود اليومية — تعديل مسودة",
    category: "القيود واليومية العامة",
    description: "تعديل بنود مسودة القيد قبل الترحيل",
    dependsOn: "journal.view",
  },
  {
    key: "journal.post",
    label: "قيود اليومية — ترحيل قيد",
    category: "القيود واليومية العامة",
    description: "ترحيل قيود اليومية واعتماد أثرها المالي النهائي",
    dependsOn: "journal.view",
  },
  {
    key: "journal.void",
    label: "قيود اليومية — إلغاء مسودة",
    category: "القيود واليومية العامة",
    description: "إلغاء مسودات القيود غير المرحّلة",
    dependsOn: "journal.view",
  },
  {
    key: "journal.reverse",
    label: "قيود اليومية — عكس قيد مرحّل",
    category: "القيود واليومية العامة",
    description: "إنشاء قيد عكسي محاسبي لقيد مرحل مع الحفاظ على الأثر والتسلسل",
    dependsOn: "journal.view",
  },

  // 3. المستندات التجارية
  {
    key: "documents.view",
    label: "المستندات التجارية — عرض",
    category: "المبيعات والمشتريات",
    description: "عرض مستندات المبيعات والمشتريات والمردودات وتذاكر الوزن",
  },
  {
    key: "documents.create",
    label: "المستندات التجارية — إضافة مسودة",
    category: "المبيعات والمشتريات",
    description: "إنشاء مستند تجاري جديد كمسودة",
    dependsOn: "documents.view",
  },
  {
    key: "documents.post",
    label: "المستندات التجارية — ترحيل المستند",
    category: "المبيعات والمشتريات",
    description: "ترحيل المستند التجاري وتوليد قيده المحاسبي وحركته المخزنية",
    dependsOn: "documents.view",
  },

  // 4. المخازن والتبريد
  {
    key: "stock.view",
    label: "المخازن والتبريد — عرض الحركة والأرصدة",
    category: "المخازن والتبريد",
    description: "عرض كروت الأصناف وأرصدة المخازن والثلاجات والتقارير المخزنية",
  },
  {
    key: "stock.movement",
    label: "المخازن والتبريد — إجراءات المخزون الفعلية",
    category: "المخازن والتبريد",
    description: "تنفيذ أذون الإضافة والصرف والهالك والتسويات المخزنية",
    dependsOn: "stock.view",
  },

  // 5. الأطراف والسجلات
  {
    key: "customers.view",
    label: "دليل العملاء — عرض",
    category: "السجلات والأطراف",
    description: "عرض بيانات العملاء ومطابقاتهم",
  },
  {
    key: "customers.manage",
    label: "دليل العملاء — إضافة وتعديل",
    category: "السجلات والأطراف",
    description: "إضافة عملاء جدد وتعديل بياناتهم وتفعيلهم",
    dependsOn: "customers.view",
  },
  {
    key: "suppliers.view",
    label: "دليل الموردين — عرض",
    category: "السجلات والأطراف",
    description: "عرض بيانات الموردين وحساباتهم",
  },
  {
    key: "suppliers.manage",
    label: "دليل الموردين — إضافة وتعديل",
    category: "السجلات والأطراف",
    description: "إضافة موردين جدد وتعديل بياناتهم وتفعيلهم",
    dependsOn: "suppliers.view",
  },
  {
    key: "partners.view",
    label: "دليل الشركاء — عرض",
    category: "السجلات والأطراف",
    description: "عرض بيانات الشركاء ونسبهم",
  },
  {
    key: "partners.manage",
    label: "دليل الشركاء — إضافة وتعديل",
    category: "السجلات والأطراف",
    description: "إضافة شركاء وتعديل بياناتهم",
    dependsOn: "partners.view",
  },
  {
    key: "items.view",
    label: "دليل الأصناف — عرض",
    category: "السجلات والأطراف",
    description: "عرض دليل الأصناف ومواصفاتها ووحداتها",
  },
  {
    key: "items.manage",
    label: "دليل الأصناف — إضافة وتعديل",
    category: "السجلات والأطراف",
    description: "إضافة أصناف جديدة وتعديل بياناتها",
    dependsOn: "items.view",
  },
  {
    key: "warehouses.view",
    label: "دليل المخازن — عرض",
    category: "السجلات والأطراف",
    description: "عرض المخازن والثلاجات المعرفة بالشركة",
  },
  {
    key: "warehouses.manage",
    label: "دليل المخازن — إضافة وتعديل",
    category: "السجلات والأطراف",
    description: "إضافة مخازن وثلاجات وتعديل خصائصها",
    dependsOn: "warehouses.view",
  },
  {
    key: "cost_centers.view",
    label: "مراكز التكلفة — عرض",
    category: "السجلات والأطراف",
    description: "عرض مراكز التكلفة",
  },
  {
    key: "cost_centers.manage",
    label: "مراكز التكلفة — إضافة وتعديل",
    category: "السجلات والأطراف",
    description: "إضافة مراكز تكلفة وتعديل بياناتها",
    dependsOn: "cost_centers.view",
  },
  {
    key: "cost_items.view",
    label: "دليل التكاليف — عرض",
    category: "السجلات والأطراف",
    description: "عرض بنود التكاليف المباشرة وغير المباشرة",
  },
  {
    key: "cost_items.manage",
    label: "دليل التكاليف — إضافة وتعديل",
    category: "السجلات والأطراف",
    description: "إضافة بنود تكاليف وتعديلها",
    dependsOn: "cost_items.view",
  },
  {
    key: "farms.view",
    label: "المزارع والمواسم — عرض",
    category: "السجلات والأطراف",
    description: "عرض دليل المزارع والبيفوتات والمواسم الزراعية",
  },
  {
    key: "farms.manage",
    label: "المزارع والمواسم — إضافة وتعديل",
    category: "السجلات والأطراف",
    description: "إضافة مزارع ومواسم وتعديلها",
    dependsOn: "farms.view",
  },
  {
    key: "banks.view",
    label: "دليل البنوك — عرض",
    category: "السجلات والأطراف",
    description: "عرض الحسابات البنكية ومحافظ الشيكات",
  },
  {
    key: "banks.manage",
    label: "دليل البنوك — إضافة وتعديل",
    category: "السجلات والأطراف",
    description: "إضافة بنوك وتعديل حساباتها",
    dependsOn: "banks.view",
  },
  {
    key: "account_lists.view",
    label: "قوائم الحسابات — عرض",
    category: "السجلات والأطراف",
    description: "عرض قوائم الحسابات والربط المحاسبي",
  },
  {
    key: "account_lists.manage",
    label: "قوائم الحسابات — تعديل",
    category: "السجلات والأطراف",
    description: "تعديل قوائم الحسابات الافتراضية",
    dependsOn: "account_lists.view",
  },
  {
    key: "lookup_lists.view",
    label: "قوائم البيانات المساعدة — عرض",
    category: "السجلات والأطراف",
    description: "عرض القوائم المساعدة والخيارات",
  },
  {
    key: "lookup_lists.manage",
    label: "قوائم البيانات المساعدة — تعديل",
    category: "السجلات والأطراف",
    description: "تعديل القوائم المساعدة",
    dependsOn: "lookup_lists.view",
  },

  // 6. الموارد البشرية والرواتب
  {
    key: "employees.view",
    label: "شؤون الموظفين — عرض",
    category: "الموارد البشرية والرواتب",
    description: "عرض بيانات الموظفين والرواتب الأساسية",
  },
  {
    key: "employees.manage",
    label: "شؤون الموظفين — إضافة وتعديل",
    category: "الموارد البشرية والرواتب",
    description: "إضافة وتعديل بيانات الموظفين ورواتبهم وبدلاتهم",
    dependsOn: "employees.view",
  },
  {
    key: "payroll.view",
    label: "الرواتب — عرض كشوف الرواتب واليومية والمفردات",
    category: "الموارد البشرية والرواتب",
    description: "عرض يومية الرواتب وكشف الرواتب الشهري ومفردات الراتب",
  },
  {
    key: "payroll.post",
    label: "الرواتب — تسجيل الحركات وترحيل مسير الرواتب",
    category: "الموارد البشرية والرواتب",
    description: "تسجيل حركات المرتبات الشهرية وترحيل القيد المحاسبي للرواتب",
    dependsOn: "payroll.view",
  },

  // 7. الأصول الثابتة والإهلاك
  {
    key: "assets.view",
    label: "الأصول الثابتة — عرض",
    category: "الأصول والإهلاك",
    description: "عرض سجل الأصول الثابتة ونسب الإهلاك والقيم الدفترية",
  },
  {
    key: "assets.manage",
    label: "الأصول الثابتة — إضافة وتعديل",
    category: "الأصول والإهلاك",
    description: "إضافة أصول ثابتة وتعديل قيم الشراء ومجمع الإهلاك",
    dependsOn: "assets.view",
  },
  {
    key: "depreciation.view",
    label: "حاسبة الإهلاك — عرض",
    category: "الأصول والإهلاك",
    description: "استخدام حاسبة الإهلاك التقديرية",
  },
  {
    key: "depreciation.calculate",
    label: "تنفيذ الإهلاك المحاسبي للأصول",
    category: "الأصول والإهلاك",
    description: "تنفيذ حركة الإهلاك الشهري وتوليد قيد الإهلاك المحاسبي",
    dependsOn: "assets.view",
  },

  // 8. التكاليف
  {
    key: "costs.view",
    label: "حسابات التكاليف — عرض الجداول والحاسبات",
    category: "التكاليف والأنشطة المتخصصة",
    description: "عرض تكاليف الاستيراد والتصدير والزراعات والتصنيع والإنتاج الحيواني",
  },
  {
    key: "costs.manage",
    label: "حسابات التكاليف — تسجيل التكاليف",
    category: "التكاليف والأنشطة المتخصصة",
    description: "تسجيل مدخلات ومصاريف أوامر التكلفة والمواسم",
    dependsOn: "costs.view",
  },

  // 9. حقوق الملكية
  {
    key: "equity.view",
    label: "حقوق الملكية والأرباح والخسائر — عرض",
    category: "حقوق الملكية وتوزيع الأرباح",
    description: "عرض قائمة التغير في حقوق الملكية وملخص توزيع الأرباح وحساب الأرباح والخسائر",
  },
  {
    key: "equity.distribute",
    label: "حقوق الملكية — ترحيل توزيعات الأرباح",
    category: "حقوق الملكية وتوزيع الأرباح",
    description: "اعتماد وتوزيع الأرباح على الشركاء وتوليد قيودها",
    dependsOn: "equity.view",
  },

  // 10. التقارير المالية والختامية
  {
    key: "reports.general_ledger",
    label: "التقارير المالية — الأستاذ العام",
    category: "التقارير المالية والمحاسبية",
    description: "عرض تقرير الأستاذ العام وتفاصيل الحسابات",
  },
  {
    key: "reports.subsidiary_ledger",
    label: "التقارير المالية — الأستاذ المساعد",
    category: "التقارير المالية والمحاسبية",
    description: "عرض تقرير الأستاذ المساعد للحسابات التحليلية",
  },
  {
    key: "reports.account_statement",
    label: "التقارير المالية — كشف الحساب",
    category: "التقارير المالية والمحاسبية",
    description: "عرض كشف حساب تفصيلي خلال فترة محددة",
  },
  {
    key: "reports.trial_balance",
    label: "التقارير المالية — ميزان المراجعة",
    category: "التقارير المالية والمحاسبية",
    description: "عرض ميزان المراجعة بالأرصدة والمجاميع",
  },
  {
    key: "reports.income_statement",
    label: "التقارير المالية — قائمة الدخل",
    category: "التقارير المالية والمحاسبية",
    description: "عرض قائمة الدخل والإيرادات والمصروفات وصافي الربح",
  },
  {
    key: "reports.balance_sheet",
    label: "التقارير المالية — قائمة المركز المالي",
    category: "التقارير المالية والمحاسبية",
    description: "عرض الميزانية العمومية وقائمة المركز المالي",
  },
  {
    key: "reports.cash_flow",
    label: "التقارير المالية — قوائم التدفقات النقدية",
    category: "التقارير المالية والمحاسبية",
    description: "عرض قائمة التدفقات النقدية المباشرة وغير المباشرة",
  },
  {
    key: "reports.sales_purchases",
    label: "التقارير التحليلية — المبيعات والمشتريات",
    category: "التقارير المالية والمحاسبية",
    description: "عرض تقارير المبيعات والمشتريات الدورية",
  },
  {
    key: "reports.cost_centers",
    label: "التقارير التحليلية — تقرير مراكز التكلفة",
    category: "التقارير المالية والمحاسبية",
    description: "عرض تقرير المصروفات والإيرادات حسب مراكز التكلفة",
  },
  {
    key: "reports.outstanding_balances",
    label: "التقارير التحليلية — تقرير المديونية",
    category: "التقارير المالية والمحاسبية",
    description: "عرض تقرير أرصدة العملاء والموردين ومديونياتهم",
  },
  {
    key: "reports.daily",
    label: "التقارير التحليلية — تقارير اليومية",
    category: "التقارير المالية والمحاسبية",
    description: "عرض حركة اليومية والملخص اليومي",
  },
  {
    key: "reports.bank_treasury",
    label: "التقارير النقدية — كشوف البنوك والخزينة",
    category: "التقارير المالية والمحاسبية",
    description: "عرض كشوف حسابات البنوك وحركة الخزينة ومطابقاتها",
  },

  // 11. سجل النشاط
  {
    key: "audit.view",
    label: "سجل النشاط والمراجعة — عرض",
    category: "الأمان والمراجعة",
    description: "الاطلاع على سجل النشاط والعمليات وتتبع التغييرات والمستخدمين",
  },

  // 12. إعدادات الشركة والفترات
  {
    key: "settings.view",
    label: "إعدادات الشركة والفترات — عرض",
    category: "إعدادات المنشأة",
    description: "عرض بيانات المنشأة والفترات المالية وحالاتها",
  },
  {
    key: "settings.manage",
    label: "إعدادات الشركة والفترات — إدارة وإقفال",
    category: "إعدادات المنشأة",
    description: "تعديل بيانات المنشأة وإضافة الفترات المالية وإقفالها وإعادة فتحها",
    dependsOn: "settings.view",
  },
] as const;

export type PermissionKey = (typeof PERMISSION_DEFINITIONS)[number]["key"];

const PERMISSION_SET = new Set<string>(
  PERMISSION_DEFINITIONS.map((def) => def.key),
);

export function isValidPermissionKey(key: string): key is PermissionKey {
  return PERMISSION_SET.has(key);
}

export type PermissionPrincipal = {
  id: string;
  companyId: number;
  role: string;
  isActive: boolean;
  permissions?: readonly string[] | unknown;
  name?: string;
  username?: string | null;
  email?: string | null;
  company?: { name: string };
};

export function can(
  user: PermissionPrincipal | null | undefined,
  permission: PermissionKey,
): boolean {
  if (!user || !user.isActive) return false;
  if (user.role === "admin") return true;
  if (!isValidPermissionKey(permission)) return false;

  const perms = Array.isArray(user.permissions) ? user.permissions : [];
  return perms.includes(permission);
}
