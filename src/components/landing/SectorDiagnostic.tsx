'use client';

import React, { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Sparkles, CheckCircle2, RotateCcw, ArrowRight, ShieldAlert, Award, Clock } from 'lucide-react';

interface SectorDiagnosticProps {
  onOpenDemo?: () => void;
}

export const SectorDiagnostic: React.FC<SectorDiagnosticProps> = ({ onOpenDemo }) => {
  const t = useTranslations('diagnostic');
  const locale = useLocale();
  const isAr = locale === 'ar';

  const [step, setStep] = useState<number>(1);
  const [selectedActivity, setSelectedActivity] = useState<string>('export');
  const [selectedVolume, setSelectedVolume] = useState<string>('mid');
  const [selectedChallenge, setSelectedChallenge] = useState<string>('shrinkage');

  const step1Options = [
    { id: 'export', text: t('step1Opt1') },
    { id: 'storage', text: t('step1Opt2') },
    { id: 'wholesale', text: t('step1Opt3') },
    { id: 'manufacturing', text: t('step1Opt4') },
  ];

  const step2Options = [
    { id: 'low', text: t('step2Opt1') },
    { id: 'mid', text: t('step2Opt2') },
    { id: 'high', text: t('step2Opt3') },
  ];

  const step3Options = [
    { id: 'shrinkage', text: t('step3Opt1') },
    { id: 'growers', text: t('step3Opt2') },
    { id: 'eta', text: t('step3Opt3') },
    { id: 'excel', text: t('step3Opt4') },
  ];

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      setStep(4); // Result view
    }
  };

  const handleReset = () => {
    setStep(1);
  };

  return (
    <section id="diagnostic" className="relative py-24 sm:py-32 bg-white overflow-hidden border-t border-border">
      {/* Ambient Lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[55rem] h-[55rem] rounded-full bg-emerald-500/5 filter blur-[160px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-green-700 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-green-700" />
            <span className="text-[11px] uppercase tracking-wider font-semibold">{t('badge')}</span>
          </div>

          <h2 className="font-kufi text-3xl sm:text-5xl font-bold tracking-tight text-ink-900 leading-tight">
            {t('title')}
          </h2>

          <p className="text-sm sm:text-base text-ink-600 font-normal leading-relaxed">
            {t('subtitle')}
          </p>
        </div>

        {/* Diagnostic Interactive Container */}
        <div className="p-6 sm:p-10 rounded-3xl bg-canvas border border-border shadow-lg">
          
          {step < 4 ? (
            <div className="space-y-8 text-start">
              
              {/* Step Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-green-700 font-bold">
                  <span>{isAr ? `الخطوة ${step} من 3` : `Step ${step} of 3`}</span>
                  <span>{step === 1 ? '33%' : step === 2 ? '66%' : '100%'}</span>
                </div>
                <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-700 transition-all duration-500 rounded-full"
                    style={{ width: step === 1 ? '33%' : step === 2 ? '66%' : '100%' }}
                  />
                </div>
              </div>

              {/* Step 1: Business Activity */}
              {step === 1 && (
                <div className="space-y-4 animate-fade-in">
                  <h3 className="font-kufi font-bold text-lg text-ink-900">
                    {t('step1')}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {step1Options.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setSelectedActivity(opt.id)}
                        className={`p-4 rounded-xl border text-start text-xs sm:text-sm font-medium transition-all ${
                          selectedActivity === opt.id
                            ? 'bg-emerald-50 border-green-700 text-green-700 font-bold shadow-xs'
                            : 'bg-white border-border text-ink-900 hover:border-green-600/40 hover:text-green-700 shadow-2xs'
                        }`}
                      >
                        {opt.text}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Voucher Volume */}
              {step === 2 && (
                <div className="space-y-4 animate-fade-in">
                  <h3 className="font-kufi font-bold text-lg text-ink-900">
                    {t('step2')}
                  </h3>
                  <div className="space-y-3">
                    {step2Options.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setSelectedVolume(opt.id)}
                        className={`w-full p-4 rounded-xl border text-start text-xs sm:text-sm font-medium transition-all ${
                          selectedVolume === opt.id
                            ? 'bg-emerald-50 border-green-700 text-green-700 font-bold shadow-xs'
                            : 'bg-white border-border text-ink-900 hover:border-green-600/40 hover:text-green-700 shadow-2xs'
                        }`}
                      >
                        {opt.text}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Core Challenge */}
              {step === 3 && (
                <div className="space-y-4 animate-fade-in">
                  <h3 className="font-kufi font-bold text-lg text-ink-900">
                    {t('step3')}
                  </h3>
                  <div className="space-y-3">
                    {step3Options.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setSelectedChallenge(opt.id)}
                        className={`w-full p-4 rounded-xl border text-start text-xs sm:text-sm font-medium transition-all ${
                          selectedChallenge === opt.id
                            ? 'bg-emerald-50 border-green-700 text-green-700 font-bold shadow-xs'
                            : 'bg-white border-border text-ink-900 hover:border-green-600/40 hover:text-green-700 shadow-2xs'
                        }`}
                      >
                        {opt.text}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Navigation Action */}
              <div className="pt-4 flex items-center justify-between border-t border-border">
                {step > 1 ? (
                  <button
                    onClick={() => setStep(step - 1)}
                    className="text-xs text-ink-600 hover:text-ink-900 transition-colors"
                  >
                    {isAr ? 'الرجوع للخطوة السابقة' : 'Previous Step'}
                  </button>
                ) : <div />}

                <button
                  onClick={handleNext}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-green-700 hover:bg-green-800 text-white font-bold text-xs shadow-md shadow-green-700/20 transition-all"
                >
                  <span>{step === 3 ? (isAr ? 'عرض النتيجة والتوصية' : 'View Recommendation') : (isAr ? 'التالي' : 'Next')}</span>
                  <ArrowRight className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
                </button>
              </div>

            </div>
          ) : (
            /* Result Screen */
            <div className="space-y-6 text-start animate-fade-in">
              
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-green-700 text-xs font-bold border border-emerald-200">
                    {t('resultAffinity')}
                  </span>
                  <h3 className="font-kufi font-bold text-xl sm:text-2xl text-ink-900 mt-2">
                    {t('resultTitle')}
                  </h3>
                </div>

                <Award className="w-10 h-10 text-green-700 shrink-0" />
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-white border border-border text-xs sm:text-sm text-ink-900 leading-relaxed flex items-start gap-3 shadow-xs">
                  <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-green-700 block mb-1">
                      {t('recommendedTree')}
                    </span>
                    <span className="text-ink-600">
                      تم تخصيص دليل الحسابات ليتضمن حسابات المزارعين، وسيط أذونات الميزان، وفرز درجات التصدير.
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-border text-xs sm:text-sm text-ink-900 leading-relaxed flex items-start gap-3 shadow-xs">
                  <Clock className="w-5 h-5 text-green-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-ink-900 block mb-1">
                      {t('recommendedModules')}
                    </span>
                    <span className="text-green-700 font-semibold">
                      {t('expectedSavings')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 border-t border-border">
                <button
                  onClick={onOpenDemo}
                  className="flex-1 py-4 px-6 rounded-xl bg-green-700 hover:bg-green-800 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-green-700/20 text-center transition-all"
                >
                  {t('applyBtn')}
                </button>

                <button
                  onClick={handleReset}
                  className="inline-flex items-center justify-center gap-2 py-4 px-6 rounded-xl bg-white hover:bg-gray-50 text-ink-600 hover:text-ink-900 text-xs font-semibold transition-all border border-border shadow-xs"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{t('retake')}</span>
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </section>
  );
};
