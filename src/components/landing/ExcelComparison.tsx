'use client';

import React, { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Sparkles, FileSpreadsheet, ShieldCheck, AlertTriangle, Check, ArrowRight } from 'lucide-react';

interface ExcelComparisonProps {
  onOpenDemo?: () => void;
}

export const ExcelComparison: React.FC<ExcelComparisonProps> = ({ onOpenDemo }) => {
  const t = useTranslations('excelComparison');
  const locale = useLocale();
  const isAr = locale === 'ar';

  const [activeTab, setActiveTab] = useState<'excel' | 'ledger'>('ledger');

  const perks = [t('perk1'), t('perk2'), t('perk3'), t('perk4')];

  return (
    <section id="excel" className="relative py-24 sm:py-32 bg-white overflow-hidden border-t border-border">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60rem] h-[60rem] rounded-full bg-emerald-500/5 filter blur-[170px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10">
        
        <div className="p-6 sm:p-12 lg:p-14 rounded-3xl bg-gradient-to-br from-canvas via-white to-canvas border border-border shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            {/* Left Column: Interactive Before / After Split Showcase */}
            <div className="lg:col-span-6 space-y-4">
              
              {/* Toggle Switch */}
              <div className="flex items-center gap-2 p-1.5 rounded-xl bg-white border border-border shadow-xs max-w-md mx-auto lg:mx-0">
                <button
                  onClick={() => setActiveTab('excel')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'excel'
                      ? 'bg-danger text-white shadow-sm'
                      : 'text-ink-600 hover:text-ink-900'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{t('excelTab')}</span>
                </button>

                <button
                  onClick={() => setActiveTab('ledger')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'ledger'
                      ? 'bg-green-700 text-white font-bold shadow-sm'
                      : 'text-ink-600 hover:text-ink-900'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{t('ledgerTab')}</span>
                </button>
              </div>

              {/* Dynamic Presentation Card */}
              <div className="relative rounded-2xl overflow-hidden border border-border shadow-sm min-h-[360px] bg-white p-5 sm:p-6 text-start">
                
                {activeTab === 'excel' ? (
                  /* Excel Failure Simulation */
                  <div className="space-y-4 animate-fade-in font-mono text-xs">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                      <div className="flex items-center gap-2 text-danger font-bold">
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>كشف حساب موردين (إكسيل) — تالف</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-danger/10 text-danger text-[10px] font-bold">غير مدقق</span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-danger text-[11px] leading-relaxed">
                      {t('excelError')}
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-[11px] border-collapse text-gray-700">
                        <thead>
                          <tr className="bg-gray-100 border-b border-gray-300">
                            <th className="p-1.5 text-start">التاريخ</th>
                            <th className="p-1.5 text-start">المستند</th>
                            <th className="p-1.5 text-end">مدين</th>
                            <th className="p-1.5 text-end">دائن</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-gray-200">
                            <td className="p-1.5">12/09</td>
                            <td className="p-1.5">فاتورة رقم 412</td>
                            <td className="p-1.5 text-end">180,000</td>
                            <td className="p-1.5 text-end">-</td>
                          </tr>
                          <tr className="border-b border-gray-200 bg-red-50 text-danger font-bold">
                            <td className="p-1.5">14/09</td>
                            <td className="p-1.5">تسوية توريد بطاطس</td>
                            <td className="p-1.5 text-end">#REF!</td>
                            <td className="p-1.5 text-end">#VALUE!</td>
                          </tr>
                          <tr className="border-b border-gray-200">
                            <td className="p-1.5">15/09</td>
                            <td className="p-1.5">صرف نقدي من الخزينة</td>
                            <td className="p-1.5 text-end">-</td>
                            <td className="p-1.5 text-end">50,000</td>
                          </tr>
                          <tr className="bg-gray-100 font-bold">
                            <td className="p-1.5" colSpan={2}>الرصيد المحسوب</td>
                            <td className="p-1.5 text-end text-danger" colSpan={2}>
                              #ERROR (فارق 70,000 ج.م غير مقيد)
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="text-[10px] text-gray-500 pt-2 border-t border-gray-200">
                      * تم تعديل المعادلة يدوياً بواسطة أحد المستخدمين دون حفظ سجل التعديل.
                    </div>
                  </div>
                ) : (
                  /* Mohasby Balanced Ledger Sheet */
                  <div className="space-y-4 animate-fade-in font-sans text-xs">
                    <div className="flex items-center justify-between pb-3 border-b border-border">
                      <div className="flex items-center gap-2 text-green-700 font-bold font-kufi">
                        <ShieldCheck className="w-4 h-4 text-success" />
                        <span>دفتر الأستاذ العام — محاسبي</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-success/10 text-success text-[10px] font-bold border border-success/30">
                        معتمد ومدقق ✓
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200/80 text-green-700 text-[11px] leading-relaxed">
                      {t('ledgerStatus')}
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-[11px] border-collapse text-ink-900">
                        <thead>
                          <tr className="bg-canvas border-b border-border text-ink-600">
                            <th className="p-2 text-start">القيد / التاريخ</th>
                            <th className="p-2 text-start">البيان ومركز التكلفة</th>
                            <th className="p-2 text-end">مدين (ج.م)</th>
                            <th className="p-2 text-end">دائن (ج.م)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          <tr>
                            <td className="p-2 font-mono">#1041 • 12/09</td>
                            <td className="p-2">توريد بطاطس — عنبر 2 لوط 12</td>
                            <td className="p-2 text-end tabular-nums font-semibold text-green-700">180,000.00</td>
                            <td className="p-2 text-end tabular-nums text-ink-400">-</td>
                          </tr>
                          <tr>
                            <td className="p-2 font-mono">#1042 • 14/09</td>
                            <td className="p-2">تسوية هالك وفرز (2.5%)</td>
                            <td className="p-2 text-end tabular-nums font-semibold text-green-700">4,500.00</td>
                            <td className="p-2 text-end tabular-nums text-ink-400">-</td>
                          </tr>
                          <tr>
                            <td className="p-2 font-mono">#1043 • 15/09</td>
                            <td className="p-2">شيك بنكي رقم 88120</td>
                            <td className="p-2 text-end tabular-nums text-ink-400">-</td>
                            <td className="p-2 text-end tabular-nums font-semibold text-ink-900">184,500.00</td>
                          </tr>
                          <tr className="accounting-double-rule bg-canvas/60 font-bold">
                            <td className="p-2" colSpan={2}>المجموع المتزن (تطابق تام)</td>
                            <td className="p-2 text-end tabular-nums text-green-700">184,500.00</td>
                            <td className="p-2 text-end tabular-nums text-ink-900">184,500.00</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="text-[10px] text-ink-600 pt-1 flex items-center justify-between">
                      <span>الرصيد المتبقي للمورد: 0.00 ج.م (مسوّى بالكامل)</span>
                      <span className="font-mono text-ink-400">تشفير SHA-256</span>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Right Column: Editorial Narrative & Checklist */}
            <div className="lg:col-span-6 space-y-6 text-start">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-green-700 text-[10px] uppercase tracking-wider font-semibold">
                  <Sparkles className="w-3 h-3 text-green-700" />
                  <span>{t('badge')}</span>
                </div>

                <h3 className="font-kufi text-2xl sm:text-4xl font-bold tracking-tight text-ink-900 leading-snug">
                  {t('title')}
                </h3>

                <p className="text-sm sm:text-base text-ink-600 font-normal leading-relaxed">
                  {t('subtitle')}
                </p>
              </div>

              {/* 4 Audited Perks List */}
              <div className="space-y-3 pt-2">
                {perks.map((perk, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 border border-emerald-200/70 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-green-700" />
                    </div>
                    <span className="text-xs sm:text-sm text-ink-900 leading-relaxed font-normal">
                      {perk}
                    </span>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              <div className="pt-4">
                <button
                  onClick={onOpenDemo}
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-green-700 hover:bg-green-800 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-green-700/20 transition-all active:scale-95"
                >
                  <span>{t('cta')}</span>
                  <ArrowRight className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
                </button>
              </div>

            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
