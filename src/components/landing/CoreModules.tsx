'use client';

import React, { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Sparkles, BookOpen, Warehouse, Calculator, Building2, Receipt, Eye, ArrowRight, CheckCircle2 } from 'lucide-react';

export interface ModuleItem {
  id: string;
  category: string;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  metrics: { label: string; value: string }[];
  highlight: string;
}

interface CoreModulesProps {
  onSelectModule: (module: ModuleItem) => void;
}

export const CoreModules: React.FC<CoreModulesProps> = ({ onSelectModule }) => {
  const t = useTranslations('modules');
  const locale = useLocale();
  const isAr = locale === 'ar';

  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: t('all') },
    { id: 'ledger', label: t('ledger') },
    { id: 'inventory', label: t('inventory') },
    { id: 'costs', label: t('costs') },
    { id: 'banks', label: t('banks') },
    { id: 'taxes', label: t('taxes') },
  ];

  const modulesData: ModuleItem[] = [
    {
      id: 'general-ledger',
      category: 'ledger',
      badge: isAr ? 'قيد مزدوج متزن' : 'Strict Double-Entry',
      title: isAr ? 'القيود اليومية ودفتر الأستاذ العام' : 'General Ledger & Journal Entries',
      subtitle: isAr ? 'ترحيل فوري بلا تأخير وبلا خلل' : 'Real-time zero-error voucher posting',
      description: isAr
        ? 'تسجيل السندات والقيود الافتتاحية والختامية مع إقفال فوري، ومنع ترحيل أي قيد غير متساوي الطرفين حتى أدنى مليم.'
        : 'Record daily vouchers, opening/closing balances with strict ledger equilibrium preventing any unbalanced transactions.',
      metrics: [
        { label: isAr ? 'دقة التوازن' : 'Balance Accuracy', value: '100%' },
        { label: isAr ? 'سرعة الترحيل' : 'Posting Speed', value: '0.02s' },
      ],
      highlight: isAr ? 'رقم القيد، التاريخ، مراكز التكلفة، وطرفي المدين والدائن' : 'Voucher No., Date, Cost Center, Debits & Credits',
    },
    {
      id: 'cold-storage',
      category: 'inventory',
      badge: isAr ? 'تتبع باللوط والوزن' : 'Lot & Scale Weight',
      title: isAr ? 'المخازن وثلاجات الحاصلات الزراعية' : 'Cold Storage & Crop Inventory',
      subtitle: isAr ? 'إدارة عنبرية دقيقة وأذونات وزن' : 'Chamber management & weighbridge slips',
      description: isAr
        ? 'تتبع أذونات الميزان، الوزن القائم والصافي، نسب الشوائب والهالك، ورقم اللوط لكل شحنة بطاطس أو بصل أو موالح.'
        : 'Track scale tickets, gross vs net weights, tare deductions, and lot batches for cold-stored produce.',
      metrics: [
        { label: isAr ? 'إدارة اللوطات' : 'Batch Tracking', value: 'مفعل' },
        { label: isAr ? 'حساب الهالك' : 'Shrinkage Calc', value: 'تلقائي' },
      ],
      highlight: isAr ? 'أذونات صرف وتوريد مرتبطة بحسابات المزارعين والموردين' : 'Issue & receipt vouchers linked to grower balances',
    },
    {
      id: 'cost-centers',
      category: 'costs',
      badge: isAr ? 'تحليل الأرباح' : 'P&L Allocation',
      title: isAr ? 'مراكز التكلفة للمواسم والأراضي' : 'Cost Centers & Crop Seasons',
      subtitle: isAr ? 'معرفة تكلفة كل فدان وكل دورة' : 'Granular cost per acre and export cycle',
      description: isAr
        ? 'توزيع المصروفات المباشرة وغير المباشرة (سولار، عمالة، مبيدات، فرز) على كل قطعة أرض أو محطة لبيان صافي الربحية.'
        : 'Allocate direct and indirect operating costs (fuel, labor, packaging) to each plot of land or export station.',
      metrics: [
        { label: isAr ? 'مستويات الشجرة' : 'Tree Depth', value: '5 مستويات' },
        { label: isAr ? 'تقرير الربحية' : 'Profit Report', value: 'لحظي' },
      ],
      highlight: isAr ? 'مقارنة التكلفة الفعلية بالمقدّرة لكل موسم تصديري' : 'Actual vs projected cost variance per export season',
    },
    {
      id: 'bank-reconciliation',
      category: 'banks',
      badge: isAr ? 'تسوية فورية' : 'Instant Match',
      title: isAr ? 'البنوك والشيكات والمقبوضات' : 'Banking & Check Portfolio',
      subtitle: isAr ? 'كشوف حساب متطابقة وتتبع تواريخ الاستحقاق' : 'Reconciled statements & check maturity',
      description: isAr
        ? 'تسجيل حركة البنوك المتعددة بالجنيه والدولار، ومتابعة حافظة شيكات الموردين والعملاء (تحت التحصيل، مرفوضة، محصلة).'
        : 'Manage multi-currency accounts (EGP/USD) and track incoming/outgoing check portfolios until clearance.',
      metrics: [
        { label: isAr ? 'العملات المدعومة' : 'Currencies', value: 'EGP / USD' },
        { label: isAr ? 'إنذار الاستحقاق' : 'Maturity Alerts', value: 'يومي' },
      ],
      highlight: isAr ? 'مطابقة آلية لملفات كشف حساب البنك الأهلي وبنك مصر' : 'Automated matching for CBE, NBE, and Banque Misr CSVs',
    },
    {
      id: 'eta-tax',
      category: 'taxes',
      badge: isAr ? 'معتمد رسمياً' : 'ETA Certified',
      title: isAr ? 'الفاتورة الإلكترونية ومصلحة الضرائب' : 'ETA E-Invoicing & Tax Compliance',
      subtitle: isAr ? 'ربط مباشر دون وسيط وبلا أخطاء' : 'Direct integration with Egyptian Tax Authority',
      description: isAr
        ? 'إصدار وتوقيع الفواتير الإلكترونية المعتمدة والإشعارات الدائنة والمدينة، واستخراج إقرار ضريبة القيمة المضافة بضغطة زر.'
        : 'Sign and submit verified e-invoices, credit notes, and generate VAT return summaries with one click.',
      metrics: [
        { label: isAr ? 'إصدار الفاتورة' : 'ETA Protocol', value: 'v1.0 / v0.9' },
        { label: isAr ? 'التوقيع الرقمي' : 'Digital Seal', value: 'مشفر' },
      ],
      highlight: isAr ? 'كود الصنف الموحد GS1 / EGS متوافق تماماً مع المنظومة' : 'GS1 and EGS code validation integrated natively',
    },
    {
      id: 'trial-balance',
      category: 'ledger',
      badge: isAr ? 'قوائم ختامية' : 'Trial Balance',
      title: isAr ? 'ميزان المراجعة والتقارير الختامية' : 'Trial Balance & Financial Reports',
      subtitle: isAr ? 'جاهز للمراجع القانوني في أي وقت' : 'Audit-ready financial statements',
      description: isAr
        ? 'استخراج ميزان المراجعة بالمجاميع والأرصدة مع مسطرة المجاميع المزدوجة، وقائمة الدخل والمركز المالي وفق المعايير المصرية.'
        : 'Generate certified Trial Balances with double-rules, balance sheets, and P&L statements according to EAS.',
      metrics: [
        { label: isAr ? 'مستويات العرض' : 'Report Views', value: '4 درجات' },
        { label: isAr ? 'التصدير' : 'Export Options', value: 'Excel / PDF' },
      ],
      highlight: isAr ? 'أرقام جدولية مستقيمة عمودياً تمنع التداخل البصري' : 'Tabular figures with zero column misalignment',
    },
  ];

  const filteredModules = activeCategory === 'all'
    ? modulesData
    : modulesData.filter((m) => m.category === activeCategory);

  return (
    <section id="modules" className="relative py-24 sm:py-32 bg-canvas overflow-hidden border-t border-border">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[50rem] h-[50rem] rounded-full bg-emerald-500/5 filter blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-green-700 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-green-700" />
            <span className="text-[11px] uppercase tracking-wider font-semibold">{t('badge')}</span>
          </div>

          <h2 className="font-kufi text-3xl sm:text-5xl font-bold tracking-tight text-ink-900 leading-tight">
            {t('title')}
          </h2>

          <p className="text-sm sm:text-base text-ink-600 font-normal max-w-2xl mx-auto leading-relaxed">
            {t('subtitle')}
          </p>

          {/* Category Filter Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 pt-6">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-5 py-2.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-300 ${
                  activeCategory === cat.id
                    ? 'bg-green-700 text-white font-bold shadow-md shadow-green-700/20'
                    : 'bg-white text-ink-600 hover:text-green-700 border border-border hover:border-green-600/40 shadow-xs'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Modules Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredModules.map((mod) => (
            <div
              key={mod.id}
              className="group relative flex flex-col justify-between bg-white rounded-3xl border border-border hover:border-green-600/40 transition-all duration-400 hover:shadow-[0_20px_45px_rgba(7,28,24,0.08)] hover:-translate-y-1 overflow-hidden p-6 sm:p-7 text-start"
            >
              <div className="space-y-4">
                
                {/* Top Badge */}
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-green-700 text-[11px] font-bold">
                    {mod.badge}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-green-700/30 group-hover:bg-green-700 transition-colors" />
                </div>

                {/* Title & Subtitle */}
                <div>
                  <h3 className="font-kufi font-bold text-lg sm:text-xl text-ink-900 group-hover:text-green-700 transition-colors">
                    {mod.title}
                  </h3>
                  <p className="text-xs text-green-700 mt-1 font-semibold">
                    {mod.subtitle}
                  </p>
                </div>

                {/* Description */}
                <p className="text-xs sm:text-sm text-ink-600 leading-relaxed font-normal">
                  {mod.description}
                </p>

                {/* Live Metric Box */}
                <div className="p-3 rounded-xl bg-canvas border border-border/80 grid grid-cols-2 gap-2 text-center">
                  {mod.metrics.map((m, idx) => (
                    <div key={idx} className="border-r last:border-r-0 border-border px-2">
                      <div className="text-[10px] text-ink-400 font-medium">{m.label}</div>
                      <div className="text-xs font-bold text-green-700 mt-0.5">{m.value}</div>
                    </div>
                  ))}
                </div>

                {/* Highlight snippet */}
                <div className="text-[11px] text-ink-600 bg-canvas px-3 py-2 rounded-lg border border-border/70 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-700 shrink-0" />
                  <span className="truncate">{mod.highlight}</span>
                </div>

              </div>

              {/* Bottom Action Button */}
              <div className="pt-6 mt-6 border-t border-border">
                <button
                  onClick={() => onSelectModule(mod)}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-emerald-50/70 hover:bg-green-700 hover:text-white text-green-700 text-xs font-semibold transition-all duration-300 border border-emerald-200/60"
                >
                  <span className="flex items-center gap-2">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{t('quickView')}</span>
                  </span>
                  <ArrowRight className={`w-3.5 h-3.5 transition-transform group-hover:translate-x-1 ${isAr ? 'rotate-180' : ''}`} />
                </button>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
