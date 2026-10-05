'use client';

import React, { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Sparkles, Layers, ShieldCheck, FileCheck, Landmark, CheckCircle } from 'lucide-react';

export const AccountingHierarchy: React.FC = () => {
  const t = useTranslations('hierarchy');
  const locale = useLocale();
  const isAr = locale === 'ar';

  const [selectedTier, setSelectedTier] = useState<number>(2);

  const tiers = [
    {
      id: 3,
      level: isAr ? 'المستوى الثالث (القمة السيادية)' : 'Tier 3 (Executive Peak)',
      title: t('tier3Title'),
      subtitle: t('tier3Subtitle'),
      desc: t('tier3Desc'),
      badge: isAr ? 'تقارير معتمدة' : 'Certified Reports',
      icon: Landmark,
      items: isAr
        ? ['ميزان المراجعة بالمجاميع والأرصدة', 'قوائم الدخل والتدفقات النقدية', 'ملفات الفحص الضريبي والفاتورة الإلكترونية']
        : ['Trial Balance with Double Rules', 'Income Statements & Cash Flow', 'ETA Tax Audit Ready Records'],
    },
    {
      id: 2,
      level: isAr ? 'المستوى الثاني (المحرك المحاسبي)' : 'Tier 2 (Core Engine)',
      title: t('tier2Title'),
      subtitle: t('tier2Subtitle'),
      desc: t('tier2Desc'),
      badge: isAr ? 'قيد متزن لحظي' : 'Balanced Engine',
      icon: Layers,
      items: isAr
        ? ['القيود المزدوجة المتزنة آلياً', 'مراكز التكلفة للأراضي والمحاصيل', 'أرصدة الموردين وجرد المخزون الفعلي']
        : ['Automated Balanced Vouchers', 'Crop & Farm Cost Centers', 'Real-time Payables & Physical Stock'],
    },
    {
      id: 1,
      level: isAr ? 'المستوى الأول (قاعدة المستندات)' : 'Tier 1 (Source Foundation)',
      title: t('tier1Title'),
      subtitle: t('tier1Subtitle'),
      desc: t('tier1Desc'),
      badge: isAr ? 'أصول الحركات' : 'Floor Sources',
      icon: FileCheck,
      items: isAr
        ? ['أذونات الميزان وتذاكر القبان', 'فواتير المشتريات وإيصالات التحصيل', 'سندات الخزينة والمصروفات النثرية']
        : ['Weighbridge Scale Tickets', 'Purchase Bills & Cash Receipts', 'Petty Cash & Expense Vouchers'],
    },
  ];

  const activeTier = tiers.find((t) => t.id === selectedTier) || tiers[1];
  const Icon = activeTier.icon;

  return (
    <section id="hierarchy" className="relative py-24 sm:py-32 bg-canvas overflow-hidden border-t border-border">
      {/* Background Lighting */}
      <div className="absolute top-1/2 right-10 w-[40rem] h-[40rem] rounded-full bg-emerald-500/5 filter blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-green-700 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-green-700" />
            <span className="text-[11px] uppercase tracking-wider font-semibold">{t('badge')}</span>
          </div>

          <h2 className="font-kufi text-3xl sm:text-5xl font-bold tracking-tight text-ink-900 leading-tight">
            {t('title')}
          </h2>

          <p className="text-sm sm:text-base text-ink-600 font-normal max-w-2xl mx-auto leading-relaxed">
            {t('subtitle')}
          </p>
        </div>

        {/* Pyramid / Tier Structure Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left / Pyramid Visual Stack */}
          <div className="lg:col-span-6 space-y-4">
            {tiers.map((tier) => {
              const isSelected = selectedTier === tier.id;
              const TierIcon = tier.icon;

              return (
                <div
                  key={tier.id}
                  onClick={() => setSelectedTier(tier.id)}
                  className={`cursor-pointer p-6 rounded-2xl border transition-all duration-300 text-start ${
                    isSelected
                      ? 'bg-white border-green-700 shadow-md scale-[1.02]'
                      : 'bg-white/80 border-border hover:border-green-600/50 hover:bg-white shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                          isSelected ? 'bg-green-700 text-white' : 'bg-canvas text-ink-600'
                        }`}
                      >
                        <TierIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-green-700 block">
                          {tier.level}
                        </span>
                        <h4 className="font-kufi font-bold text-base text-ink-900 mt-0.5">
                          {tier.title}
                        </h4>
                      </div>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                        isSelected
                          ? 'bg-green-700 text-white'
                          : 'bg-canvas text-ink-600 border border-border'
                      }`}
                    >
                      {tier.badge}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right / Selected Tier Details Display */}
          <div className="lg:col-span-6">
            <div className="p-8 sm:p-10 rounded-3xl bg-white border border-border shadow-lg space-y-6 text-start">
              
              <div className="flex items-center gap-3 border-b border-border pb-5">
                <div className="w-12 h-12 rounded-2xl bg-green-700 text-white flex items-center justify-center">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-green-700 uppercase">
                    {activeTier.level}
                  </span>
                  <h3 className="font-kufi font-bold text-xl text-ink-900">
                    {activeTier.title}
                  </h3>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-green-700">
                  {activeTier.subtitle}
                </p>
                <p className="text-sm text-ink-600 font-normal leading-relaxed">
                  {activeTier.desc}
                </p>
              </div>

              {/* Bulleted Core Deliverables */}
              <div className="space-y-3 pt-2">
                <div className="text-[11px] text-ink-400 uppercase font-bold tracking-wider">
                  {isAr ? 'عناصر هذا المستوى في المنظومة:' : 'Key deliverables in this tier:'}
                </div>
                {activeTier.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-xs text-ink-900 font-normal">
                    <CheckCircle className="w-4 h-4 text-green-700 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              {/* Security Audit Callout */}
              <div className="p-4 rounded-xl bg-canvas border border-border text-[11px] text-ink-600 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-success" />
                  <span>{isAr ? 'تكامل آلي دون تدخل بشري يدوي' : 'Seamless integration without manual reentry'}</span>
                </div>
                <span className="text-green-700 font-bold font-mono">100% AUDITED</span>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
