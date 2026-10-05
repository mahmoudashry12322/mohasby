'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { Logo } from '@/components/brand/Logo';
import { ShieldCheck, MapPin, Mail, Phone } from 'lucide-react';

export const Footer: React.FC = () => {
  const t = useTranslations('footer');
  const locale = useLocale();
  const isAr = locale === 'ar';

  return (
    <footer className="relative bg-white text-ink-900 border-t border-border pt-16 pb-12 overflow-hidden text-start">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-12">
        
        {/* Main 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Column 1: Brand & Identity (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <Link href={`/${locale}`} className="inline-block">
              <Logo theme="green" markSize={32} />
            </Link>

            <p className="text-xs text-ink-600 leading-relaxed font-normal">
              {t('about')}
            </p>

            <div className="pt-2 text-[11px] text-green-700 font-mono font-medium">
              {t('taxNumber')}
            </div>
          </div>

          {/* Column 2: Accounting Suite Links (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-kufi font-bold text-xs uppercase tracking-wider text-green-700">
              {t('col1Title')}
            </h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#modules" className="text-ink-600 hover:text-green-700 transition-colors">{t('link1')}</a></li>
              <li><a href="#modules" className="text-ink-600 hover:text-green-700 transition-colors">{t('link2')}</a></li>
              <li><a href="#modules" className="text-ink-600 hover:text-green-700 transition-colors">{t('link3')}</a></li>
              <li><a href="#modules" className="text-ink-600 hover:text-green-700 transition-colors">{t('link4')}</a></li>
              <li><a href="#modules" className="text-ink-600 hover:text-green-700 transition-colors">{t('link5')}</a></li>
            </ul>
          </div>

          {/* Column 3: Supported Sectors (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="font-kufi font-bold text-xs uppercase tracking-wider text-green-700">
              {t('col2Title')}
            </h4>
            <ul className="space-y-2 text-xs text-ink-600">
              <li>{t('sector1')}</li>
              <li>{t('sector2')}</li>
              <li>{t('sector3')}</li>
              <li>{t('sector4')}</li>
            </ul>
          </div>

          {/* Column 4: Offices & Contact (3 cols) */}
          <div className="lg:col-span-3 space-y-3 text-xs">
            <h4 className="font-kufi font-bold text-xs uppercase tracking-wider text-green-700">
              {t('col3Title')}
            </h4>
            <div className="space-y-2.5 text-ink-600">
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-green-700 shrink-0 mt-0.5" />
                <span>{t('address')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-green-700 shrink-0" />
                <span className="font-mono">{t('support')}</span>
              </div>
              <a
                href="https://wa.me/201099583525"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-green-700 transition-colors group cursor-pointer"
                title="WhatsApp: 01099583525"
              >
                <Phone className="w-3.5 h-3.5 text-green-700 shrink-0 group-hover:scale-110 transition-transform" />
                <span className="font-mono tabular-nums">{t('phone')}</span>
              </a>
            </div>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Compliance */}
        <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-ink-400">
          <p>{t('rights')}</p>
          <div className="flex items-center gap-4">
            <Link href={`/${locale}/brand`} className="hover:text-green-700 transition-colors">
              {isAr ? 'دليل الهوية والألوان' : 'Brand Specimen'}
            </Link>
            <span className="text-border">•</span>
            <span>EAS 2026</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
