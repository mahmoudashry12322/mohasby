'use client';

import React, { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Sparkles, Mail, CheckCircle2, ShieldCheck, PhoneCall } from 'lucide-react';

export const EnterpriseReserve: React.FC = () => {
  const t = useTranslations('enterprise');
  const locale = useLocale();
  const isAr = locale === 'ar';

  const [contact, setContact] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact.trim()) return;
    setIsSubmitted(true);
  };

  return (
    <section id="enterprise" className="relative py-24 sm:py-32 bg-gradient-to-b from-white via-canvas to-white overflow-hidden border-t border-border">
      {/* Background Lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50rem] h-[50rem] rounded-full bg-emerald-500/5 filter blur-[150px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-8 relative z-10 text-center space-y-7">
        
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-green-700 text-[10px] uppercase tracking-wider font-semibold shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-green-700" />
          <span>{t('badge')}</span>
        </div>

        <div className="space-y-3">
          <h2 className="font-kufi text-3xl sm:text-5xl font-bold tracking-tight text-ink-900 leading-tight">
            {t('title')}
          </h2>
          <p className="text-xs sm:text-sm text-ink-600 font-normal max-w-xl mx-auto leading-relaxed">
            {t('subtitle')}
          </p>
        </div>

        {/* Subscription / Booking Form */}
        {isSubmitted ? (
          <div className="p-8 rounded-3xl bg-white border border-border text-center space-y-3 max-w-md mx-auto shadow-xl animate-fade-in">
            <CheckCircle2 className="w-10 h-10 text-green-700 mx-auto" />
            <h4 className="font-kufi text-xl font-bold text-ink-900">{t('successTitle')}</h4>
            <p className="text-xs text-ink-600 leading-relaxed">
              {t('successDesc')}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Mail className={`w-4 h-4 text-green-700/70 absolute ${isAr ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2`} />
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder={t('placeholder')}
                  required
                  className={`w-full bg-white border border-border rounded-xl ${
                    isAr ? 'pr-11 pl-4' : 'pl-11 pr-4'
                  } py-3.5 text-xs text-ink-900 placeholder:text-ink-400 focus:outline-none focus:border-green-700 shadow-xs transition-colors`}
                />
              </div>
              <button
                type="submit"
                className="px-7 py-3.5 rounded-xl bg-green-700 hover:bg-green-800 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-green-700/20 transition-all flex-shrink-0 active:scale-95"
              >
                {t('btn')}
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 text-[11px] text-ink-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-green-700" />
              <span>{t('notice')}</span>
            </div>
          </form>
        )}

      </div>
    </section>
  );
};
