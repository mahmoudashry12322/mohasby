'use client';

import React, { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Logo } from '@/components/brand/Logo';
import { Monogram } from '@/components/brand/Monogram';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Checkbox } from '@/components/ui/Checkbox';
import { Badge } from '@/components/ui/Badge';
import { Divider } from '@/components/ui/Divider';
import { Money } from '@/components/ui/Money';
import { LeaderRow } from '@/components/ui/LeaderRow';
import { LanguageSwitch } from '@/components/ui/LanguageSwitch';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/Accordion';
import { Toast } from '@/components/ui/Toast';
import { ImageSlot } from '@/components/ui/ImageSlot';
import { EnvelopeSimple } from '@phosphor-icons/react';

export default function BrandPage() {
  const t = useTranslations('brand');
  const locale = useLocale();
  const isArabic = locale === 'ar';

  const [isLoadingBtn, setIsLoadingBtn] = useState(false);
  const [demoInputVal, setDemoInputVal] = useState('');
  const [demoInputError, setDemoInputError] = useState('');
  const [checkedBox, setCheckedBox] = useState(true);

  const toggleLoading = () => {
    setIsLoadingBtn(true);
    setTimeout(() => setIsLoadingBtn(false), 2000);
  };

  const handleDemoValidate = (e: React.FocusEvent<HTMLInputElement>) => {
    if (!e.target.value) {
      setDemoInputError(isArabic ? 'هذا الحقل مطلوب في الدفتر المحاسبي' : 'This ledger field is required');
    } else {
      setDemoInputError('');
    }
  };

  return (
    <main className="min-h-screen pb-24 text-start bg-canvas">
      {/* Top Specimen Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-border px-4 sm:px-12 py-3 flex items-center justify-between shadow-card">
        <Logo variant="horizontal" markSize={30} />
        <div className="flex items-center gap-3">
          <Badge variant="green" pill withDot className="hidden sm:inline-flex">
            {isArabic ? 'المرحلة الأولى: نظام التصميم' : 'Phase A: Design System'}
          </Badge>
          <LanguageSwitch />
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-10 space-y-16">
        {/* Specimen Hero */}
        <section className="space-y-4">
          <Badge variant="accent" pill withDot>
            {isArabic ? 'برنامج محاسبة عربي للشركات المصرية' : 'Arabic Accounting SaaS for Egyptian Enterprises'}
          </Badge>
          <h1 className="font-kufi text-3xl sm:text-5xl font-extrabold text-green-700 tracking-tight leading-tight [text-wrap:balance]">
            {t('title')}
          </h1>
          <p className="text-[16px] sm:text-[17px] text-ink-600 max-w-3xl leading-arabic font-normal">
            {t('subtitle')}
          </p>
        </section>

        <Divider />

        {/* 1. LOGO & MONOGRAM EXPLORATION */}
        <section className="space-y-8">
          <div>
            <h2 className="font-kufi text-2xl sm:text-3xl font-bold text-ink-900">
              {t('monogramsTitle')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Direction 1 */}
            <div className="p-6 rounded-card bg-white border border-border space-y-4 shadow-card">
              <div className="w-16 h-16 rounded-btn bg-canvas flex items-center justify-center border border-border">
                <Monogram direction="balance" size={44} />
              </div>
              <h4 className="font-kufi text-[16px] font-bold text-ink-900">
                {t('monogram1Title')}
              </h4>
              <p className="text-[14px] text-ink-600 leading-arabic">
                {t('monogram1Desc')}
              </p>
            </div>

            {/* Direction 2 (Selected Primary) */}
            <div className="p-6 rounded-card bg-white border-2 border-accent-500 space-y-4 shadow-elevated relative">
              <div className="absolute top-4 end-4">
                <Badge variant="accent" pill>
                  {isArabic ? 'الاتجاه المعتمد' : 'Selected Primary'}
                </Badge>
              </div>
              <div className="w-16 h-16 rounded-btn bg-canvas flex items-center justify-center border border-accent-400">
                <Monogram direction="tick" size={44} />
              </div>
              <h4 className="font-kufi text-[16px] font-bold text-green-700">
                {t('monogram2Title')}
              </h4>
              <p className="text-[14px] text-ink-600 leading-arabic">
                {t('monogram2Desc')}
              </p>
            </div>

            {/* Direction 3 */}
            <div className="p-6 rounded-card bg-white border border-border space-y-4 shadow-card">
              <div className="w-16 h-16 rounded-btn bg-canvas flex items-center justify-center border border-border">
                <Monogram direction="ledger" size={44} />
              </div>
              <h4 className="font-kufi text-[16px] font-bold text-ink-900">
                {t('monogram3Title')}
              </h4>
              <p className="text-[14px] text-ink-600 leading-arabic">
                {t('monogram3Desc')}
              </p>
            </div>
          </div>

          {/* Logo Lockup Showcase */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <div className="p-6 sm:p-8 rounded-card bg-white border border-border flex flex-col items-center justify-center gap-6 text-center shadow-card">
              <span className="text-[13px] font-sans text-ink-600 font-medium">
                {isArabic ? 'الشعار على الخلفية الفاتحة' : 'Horizontal Lockup on Light Canvas'}
              </span>
              <Logo variant="horizontal" theme="green" markSize={40} />
              <div className="flex gap-4 items-center">
                <Logo variant="mark" theme="green" markSize={26} />
                <span className="text-[12px] text-border">|</span>
                <span className="text-[13px] font-mono text-ink-600">favicon 16×16px:</span>
                <div className="w-6 h-6 rounded bg-green-700 p-0.5 flex items-center justify-center">
                  <Monogram direction="tick" size={16} color="white" />
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 rounded-card bg-green-900 ledger-ruled-dark border border-green-700/60 flex flex-col items-center justify-center gap-6 text-center shadow-elevated">
              <span className="text-[13px] font-sans text-white/80 font-medium">
                {isArabic ? 'الشعار على الخلفية الصنوبرية الداكنة' : 'Stacked Lockup on Deep Pine Panel'}
              </span>
              <Logo variant="stacked" theme="white" markSize={46} />
            </div>
          </div>
        </section>

        <Divider />

        {/* 2. COLOR PALETTE TOKENS */}
        <section className="space-y-8">
          <div>
            <h2 className="font-kufi text-2xl sm:text-3xl font-bold text-ink-900">
              {t('paletteTitle')}
            </h2>
            <p className="text-[15px] text-ink-600 max-w-3xl mt-1 leading-arabic">
              {t('paletteDesc')}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Green 700 */}
            <div className="p-3 rounded-btn bg-white border border-border space-y-2 shadow-sm">
              <div className="h-16 rounded-chip bg-green-700 shadow-inner" />
              <div className="text-[13px] font-bold text-ink-900">--green-700</div>
              <div className="text-[12px] font-mono text-ink-600">
                <bdi dir="ltr">#1F4E42</bdi>
              </div>
              <div className="text-[11px] text-green-700 font-semibold">
                {isArabic ? 'اللون الأساسي' : 'PRIMARY BRAND'}
              </div>
            </div>

            {/* Green 900 */}
            <div className="p-3 rounded-btn bg-white border border-border space-y-2 shadow-sm">
              <div className="h-16 rounded-chip bg-green-900 shadow-inner" />
              <div className="text-[13px] font-bold text-ink-900">--green-900</div>
              <div className="text-[12px] font-mono text-ink-600">
                <bdi dir="ltr">#071C18</bdi>
              </div>
              <div className="text-[11px] text-ink-600 font-medium">
                {isArabic ? 'تفاعل الزر الأساسي' : 'BUTTON HOVER'}
              </div>
            </div>

            {/* Green 950 */}
            <div className="p-3 rounded-btn bg-white border border-border space-y-2 shadow-sm">
              <div className="h-16 rounded-chip bg-green-950 shadow-inner" />
              <div className="text-[13px] font-bold text-ink-900">--green-950</div>
              <div className="text-[12px] font-mono text-ink-600">
                <bdi dir="ltr">#040E0B</bdi>
              </div>
              <div className="text-[11px] text-ink-400 font-medium">
                {isArabic ? 'خلفية داكنة' : 'DEEP PINE'}
              </div>
            </div>

            {/* Canvas */}
            <div className="p-3 rounded-btn bg-white border border-border space-y-2 shadow-sm">
              <div className="h-16 rounded-chip bg-canvas border border-border shadow-inner" />
              <div className="text-[13px] font-bold text-ink-900">--canvas</div>
              <div className="text-[12px] font-mono text-ink-600">
                <bdi dir="ltr">#F7F5F3</bdi>
              </div>
              <div className="text-[11px] text-ink-600 font-medium">
                {isArabic ? 'أرضية الصفحة' : 'PAGE CANVAS'}
              </div>
            </div>

            {/* White */}
            <div className="p-3 rounded-btn bg-white border border-border space-y-2 shadow-sm">
              <div className="h-16 rounded-chip bg-white border border-border shadow-inner" />
              <div className="text-[13px] font-bold text-ink-900">--white</div>
              <div className="text-[12px] font-mono text-ink-600">
                <bdi dir="ltr">#FFFFFF</bdi>
              </div>
              <div className="text-[11px] text-ink-600 font-medium">
                {isArabic ? 'البطاقات والحقول' : 'CARD & FORMS'}
              </div>
            </div>

            {/* Border */}
            <div className="p-3 rounded-btn bg-white border border-border space-y-2 shadow-sm">
              <div className="h-16 rounded-chip bg-border shadow-inner" />
              <div className="text-[13px] font-bold text-ink-900">--border</div>
              <div className="text-[12px] font-mono text-ink-600">
                <bdi dir="ltr">#E4E0DC</bdi>
              </div>
              <div className="text-[11px] text-ink-600 font-medium">
                {isArabic ? 'مسطرة الفواصل' : '1PX HAIRLINE'}
              </div>
            </div>

            {/* Accent 500 */}
            <div className="p-3 rounded-btn bg-white border border-border space-y-2 shadow-sm">
              <div className="h-16 rounded-chip bg-accent-500 shadow-inner" />
              <div className="text-[13px] font-bold text-ink-900">--accent-500</div>
              <div className="text-[12px] font-mono text-ink-600">
                <bdi dir="ltr">#28A78F</bdi>
              </div>
              <div className="text-[11px] text-accent-600 font-bold">
                {isArabic ? 'إجراء التمييز والمراجعة' : 'ACCENT / CTA'}
              </div>
            </div>

            {/* Accent 600 */}
            <div className="p-3 rounded-btn bg-white border border-border space-y-2 shadow-sm">
              <div className="h-16 rounded-chip bg-accent-600 shadow-inner" />
              <div className="text-[13px] font-bold text-ink-900">--accent-600</div>
              <div className="text-[12px] font-mono text-ink-600">
                <bdi dir="ltr">#208C78</bdi>
              </div>
              <div className="text-[11px] text-accent-600 font-medium">
                {isArabic ? 'تفاعل التمييز' : 'ACCENT HOVER'}
              </div>
            </div>

            {/* Ink 900 */}
            <div className="p-3 rounded-btn bg-white border border-border space-y-2 shadow-sm">
              <div className="h-16 rounded-chip bg-ink-900 shadow-inner" />
              <div className="text-[13px] font-bold text-ink-900">--ink-900</div>
              <div className="text-[12px] font-mono text-ink-600">
                <bdi dir="ltr">#1C2321</bdi>
              </div>
              <div className="text-[11px] text-ink-600 font-medium">
                {isArabic ? 'النص الأساسي' : 'PRIMARY TEXT'}
              </div>
            </div>

            {/* Ink 600 */}
            <div className="p-3 rounded-btn bg-white border border-border space-y-2 shadow-sm">
              <div className="h-16 rounded-chip bg-ink-600 shadow-inner" />
              <div className="text-[13px] font-bold text-ink-900">--ink-600</div>
              <div className="text-[12px] font-mono text-ink-600">
                <bdi dir="ltr">#6B7370</bdi>
              </div>
              <div className="text-[11px] text-ink-600 font-medium">
                {isArabic ? 'نص ثانوي (على الأبيض)' : 'SECONDARY (WHITE)'}
              </div>
            </div>

            {/* Ink Canvas */}
            <div className="p-3 rounded-btn bg-white border border-border space-y-2 shadow-sm">
              <div className="h-16 rounded-chip bg-ink-canvas shadow-inner" />
              <div className="text-[13px] font-bold text-ink-900">--ink-canvas</div>
              <div className="text-[12px] font-mono text-ink-600">
                <bdi dir="ltr">#58605D</bdi>
              </div>
              <div className="text-[11px] text-ink-600 font-medium">
                {isArabic ? 'نص ثانوي (على الأرضية)' : 'SECONDARY (CANVAS)'}
              </div>
            </div>

            {/* Danger */}
            <div className="p-3 rounded-btn bg-white border border-border space-y-2 shadow-sm">
              <div className="h-16 rounded-chip bg-danger shadow-inner" />
              <div className="text-[13px] font-bold text-ink-900">--danger</div>
              <div className="text-[12px] font-mono text-ink-600">
                <bdi dir="ltr">#B4514A</bdi>
              </div>
              <div className="text-[11px] text-danger font-medium">
                {isArabic ? 'السوالب والأخطاء' : 'NEGATIVE / ERROR'}
              </div>
            </div>
          </div>

          {/* Contrast Verification Report */}
          <div className="p-6 sm:p-8 rounded-card bg-white border border-border space-y-4 shadow-card">
            <h3 className="font-kufi text-[18px] font-bold text-ink-900">
              {isArabic ? 'تقرير فحص تباين الألوان المعتمد (WCAG 2.1 AA / AAA)' : 'Audited WCAG Contrast Verification Report'}
            </h3>
            <p className="text-[14px] text-ink-600 leading-arabic">
              {isArabic
                ? 'تم حساب نسب التباين لجميع الثنائيات المستخدمة في النظام للتأكد من سهولة القراءة التامة:'
                : 'Precise contrast ratios calculated for all active text/surface pairs:'}
            </p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px] text-start text-[14px]">
                <thead>
                  <tr className="border-b border-border text-ink-600 text-[12px]">
                    <th className="py-2.5 text-start font-medium">{isArabic ? 'العنصر النصي' : 'Text Element'}</th>
                    <th className="py-2.5 text-start font-medium">{isArabic ? 'الخلفية' : 'Surface Background'}</th>
                    <th className="py-2.5 text-end font-medium">{isArabic ? 'نسبة التباين' : 'Contrast Ratio'}</th>
                    <th className="py-2.5 text-end font-medium">{isArabic ? 'المطابقة' : 'Compliance Level'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="py-2.5 font-medium text-ink-900">{isArabic ? 'نص أبيض (White #FFFFFF)' : 'White text (#FFFFFF)'}</td>
                    <td className="py-2.5 text-ink-600">{isArabic ? 'الزر الأساسي (Green-700 #1F4E42)' : 'Primary button (Green-700)'}</td>
                    <td className="py-2.5 text-end font-mono font-semibold text-green-700"><bdi dir="ltr">9.43:1</bdi></td>
                    <td className="py-2.5 text-end"><Badge variant="success" pill>PASS (AAA)</Badge></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-medium text-ink-900">{isArabic ? 'نص أبيض (White #FFFFFF)' : 'White text (#FFFFFF)'}</td>
                    <td className="py-2.5 text-ink-600">{isArabic ? 'حالة التفاعل (Green-900 #071C18)' : 'Button hover (Green-900)'}</td>
                    <td className="py-2.5 text-end font-mono font-semibold text-green-700"><bdi dir="ltr">17.67:1</bdi></td>
                    <td className="py-2.5 text-end"><Badge variant="success" pill>PASS (AAA)</Badge></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-medium text-ink-900">{isArabic ? 'نص صنوبري داكن (Green-950 #040E0B)' : 'Deep pine text (Green-950)'}</td>
                    <td className="py-2.5 text-ink-600">{isArabic ? 'زر التمييز (Accent-500 #28A78F)' : 'Accent CTA (Accent-500)'}</td>
                    <td className="py-2.5 text-end font-mono font-semibold text-green-700"><bdi dir="ltr">10.74:1</bdi></td>
                    <td className="py-2.5 text-end"><Badge variant="success" pill>PASS (AAA)</Badge></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-medium text-ink-900">{isArabic ? 'النص الرئيسي (Ink-900 #1C2321)' : 'Primary reading text (Ink-900)'}</td>
                    <td className="py-2.5 text-ink-600">{isArabic ? 'بطاقات بيضاء (White #FFFFFF)' : 'White card surface'}</td>
                    <td className="py-2.5 text-end font-mono font-semibold text-green-700"><bdi dir="ltr">16.01:1</bdi></td>
                    <td className="py-2.5 text-end"><Badge variant="success" pill>PASS (AAA)</Badge></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-medium text-ink-900">{isArabic ? 'النص الرئيسي (Ink-900 #1C2321)' : 'Primary reading text (Ink-900)'}</td>
                    <td className="py-2.5 text-ink-600">{isArabic ? 'أرضية الصفحة (Canvas #F7F5F3)' : 'Page canvas'}</td>
                    <td className="py-2.5 text-end font-mono font-semibold text-green-700"><bdi dir="ltr">14.72:1</bdi></td>
                    <td className="py-2.5 text-end"><Badge variant="success" pill>PASS (AAA)</Badge></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-medium text-ink-900">{isArabic ? 'النص الثانوي (Ink-600 #6B7370)' : 'Secondary text (Ink-600)'}</td>
                    <td className="py-2.5 text-ink-600">{isArabic ? 'بطاقات بيضاء (White #FFFFFF)' : 'White card surface'}</td>
                    <td className="py-2.5 text-end font-mono font-semibold text-green-700"><bdi dir="ltr">4.87:1</bdi></td>
                    <td className="py-2.5 text-end"><Badge variant="success" pill>PASS (AA)</Badge></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-medium text-ink-900">{isArabic ? 'النص الثانوي (Ink-Canvas #58605D)' : 'Secondary text on canvas'}</td>
                    <td className="py-2.5 text-ink-600">{isArabic ? 'أرضية الصفحة (Canvas #F7F5F3)' : 'Page canvas'}</td>
                    <td className="py-2.5 text-end font-mono font-semibold text-green-700"><bdi dir="ltr">5.95:1</bdi></td>
                    <td className="py-2.5 text-end"><Badge variant="success" pill>PASS (AA)</Badge></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-[12px] text-ink-600 border-t border-border pt-3">
              {isArabic
                ? 'ملاحظة تدقيقية: يبلغ تباين لون Ink-600 على أرضية Canvas نسبة 4.48:1 (أقل بقليل من حد 4.5:1 للمتون الصغيرة)، لذلك يُستخدم Ink-600 على الأسطح البيضاء فقط، بينما يتم استخدام Ink-Canvas (#58605D بنسبة 5.95:1) للنصوص الثانوية على أرضية Canvas.'
                : 'Audit Note: Ink-600 on Canvas measures 4.48:1. Per brief requirements, Ink-600 is used on white surfaces only (4.87:1), while darkened Ink-Canvas (#58605D, 5.95:1) is used for canvas secondary body text.'}
            </p>
          </div>
        </section>

        <Divider />

        {/* 3. TYPOGRAPHY & TABULAR FIGURES */}
        <section className="space-y-8">
          <div>
            <h2 className="font-kufi text-2xl sm:text-3xl font-bold text-ink-900">
              {t('typographyTitle')}
            </h2>
            <p className="text-[15px] text-ink-600 max-w-3xl mt-1 leading-arabic">
              {t('typographyDesc')}
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-card bg-white border border-border space-y-6 shadow-card">
            {/* Arabic Display */}
            <div className="border-b border-border pb-6">
              <span className="text-[12px] font-mono text-ink-600 uppercase">Noto Kufi Arabic — 800 ExtraBold</span>
              <h3 className="font-kufi text-2xl sm:text-4xl font-extrabold text-green-700 mt-2 [text-wrap:balance]">
                حساباتك متزنة من أول قيد.
              </h3>
            </div>

            {/* Body & Arabic UI */}
            <div className="border-b border-border pb-6">
              <span className="text-[12px] font-mono text-ink-600 uppercase">IBM Plex Sans Arabic — 400 / 500 / 600</span>
              <p className="font-sans text-[15px] sm:text-[16px] text-ink-900 mt-2 leading-arabic">
                قيود اليومية والمخازن والثلاجات ومراكز التكلفة والبنوك والمرتبات والقوائم المالية، في دفتر واحد يراجع نفسه قبل أن تراجعه أنت.
              </p>
            </div>

            {/* Latin Display */}
            <div className="border-b border-border pb-6">
              <span className="text-[12px] font-mono text-ink-600 uppercase">Familjen Grotesk — 600 / 700</span>
              <p className="font-latin text-xl sm:text-2xl font-bold text-green-700 mt-2">
                Mohasby Cloud Accounting for Egyptian Enterprises
              </p>
            </div>

            {/* Strict Tabular Numbers Alignment Table */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <span className="text-[13px] font-bold text-ink-900">
                  {isArabic ? 'اختبار استقامة الأرقام الجدولية' : 'Tabular Figures Alignment Test'}
                </span>
                <Badge variant="success" pill withDot>
                  {isArabic ? 'متزن ومحاذى رأسياً' : 'Reconciled & Aligned'}
                </Badge>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[440px] text-start text-[14px]">
                  <thead>
                    <tr className="border-b border-border text-ink-600 text-[12px]">
                      <th className="py-2 text-start font-medium">{isArabic ? 'الحساب' : 'Account'}</th>
                      <th className="py-2 text-end font-medium">{isArabic ? 'مدين (ج.م)' : 'Debit (EGP)'}</th>
                      <th className="py-2 text-end font-medium">{isArabic ? 'دائن (ج.م)' : 'Credit (EGP)'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr>
                      <td className="py-2.5 font-medium text-ink-900">{isArabic ? 'المشتريات المحلية — بطاطس نوالة' : 'Local Crop Purchases'}</td>
                      <td className="py-2.5 text-end"><Money amount={250000} /></td>
                      <td className="py-2.5 text-end text-ink-400">—</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-medium text-ink-900">{isArabic ? 'ضريبة القيمة المضافة 14%' : 'VAT 14% Input'}</td>
                      <td className="py-2.5 text-end"><Money amount={35000} /></td>
                      <td className="py-2.5 text-end text-ink-400">—</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-medium text-ink-900">{isArabic ? 'موردو التعبئة والتغليف (محطة السادات)' : 'Suppliers Packaging'}</td>
                      <td className="py-2.5 text-end text-ink-400">—</td>
                      <td className="py-2.5 text-end"><Money amount={285000} /></td>
                    </tr>
                    {/* Double Rule Accounting Total */}
                    <tr className="accounting-double-rule font-bold text-ink-900 bg-canvas">
                      <td className="py-3 text-start">{isArabic ? 'المجموع المتزن' : 'Total Balanced'}</td>
                      <td className="py-3 text-end"><Money amount={285000} /></td>
                      <td className="py-3 text-end"><Money amount={285000} /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        <Divider />

        {/* 4. BUTTON HIERARCHY & STATES */}
        <section className="space-y-8">
          <div>
            <h2 className="font-kufi text-2xl sm:text-3xl font-bold text-ink-900">
              {t('buttonsTitle')}
            </h2>
            <p className="text-[15px] text-ink-600 max-w-3xl mt-1 leading-arabic">
              {t('buttonsDesc')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Primary Button */}
            <div className="p-6 rounded-card bg-white border border-border space-y-4 shadow-card">
              <span className="text-[12px] font-mono text-ink-600 uppercase font-medium">Primary (Green-700)</span>
              <div className="space-y-3">
                <Button variant="primary" className="w-full">
                  {isArabic ? 'سجّل الدخول' : 'Sign In'}
                </Button>
                <Button variant="primary" disabled className="w-full">
                  {isArabic ? 'حالة التعطيل' : 'Disabled State'}
                </Button>
                <Button
                  variant="primary"
                  isLoading={isLoadingBtn}
                  onClick={toggleLoading}
                  className="w-full"
                >
                  {isArabic ? 'اختبار حالة التحميل' : 'Test Loading State'}
                </Button>
              </div>
            </div>

            {/* Accent CTA Button */}
            <div className="p-6 rounded-card bg-white border-2 border-accent-500 space-y-4 shadow-elevated">
              <span className="text-[12px] font-mono text-accent-600 uppercase font-bold">Accent CTA (Accent-500)</span>
              <div className="space-y-3">
                <Button variant="accent" className="w-full">
                  {isArabic ? 'ابدأ تجربتك المجانية' : 'Start Free Trial'}
                </Button>
                <p className="text-[12px] text-ink-600 leading-normal">
                  {isArabic
                    ? 'يستخدم مرة واحدة في الشاشة مع نص بلون Green-950 وتوهج نحاسي دقيق.'
                    : 'Used once per screen with Green-950 text and focused accent glow.'}
                </p>
              </div>
            </div>

            {/* Secondary & Dark Variants */}
            <div className="p-6 rounded-card bg-white border border-border space-y-4 shadow-card">
              <span className="text-[12px] font-mono text-ink-600 uppercase font-medium">Secondary & Ghost Variants</span>
              <div className="space-y-3">
                <Button variant="secondary" className="w-full">
                  {isArabic ? 'شاهد كيف يعمل' : 'See How It Works'}
                </Button>
                <div className="flex items-center justify-between pt-2">
                  <Button variant="ghost">
                    {isArabic ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}
                  </Button>
                  <Button variant="danger">
                    {isArabic ? 'إلغاء السند' : 'Void Voucher'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Divider />

        {/* 5. FORM CONTROLS & VALIDATION */}
        <section className="space-y-8">
          <div>
            <h2 className="font-kufi text-2xl sm:text-3xl font-bold text-ink-900">
              {t('formsTitle')}
            </h2>
            <p className="text-[15px] text-ink-600 max-w-3xl mt-1 leading-arabic">
              {t('formsDesc')}
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-card bg-white border border-border space-y-6 shadow-card max-w-xl mx-auto">
            <Input
              label={isArabic ? 'البريد الإلكتروني' : 'Email Address'}
              placeholder="demo@mohasby.app"
              startIcon={<EnvelopeSimple size={18} />}
              hint={isArabic ? 'استخدم بريد الشركة المسجل' : 'Enter registered company email'}
            />

            <PasswordInput
              label={isArabic ? 'كلمة المرور' : 'Password'}
              placeholder="••••••••••••"
              showPasswordLabel={isArabic ? 'إظهار كلمة المرور' : 'Show password'}
              hidePasswordLabel={isArabic ? 'إخفاء كلمة المرور' : 'Hide password'}
            />

            {/* Blur Validation Field */}
            <Input
              label={isArabic ? 'رقم السجل التجاري / البطاقة الضريبية' : 'Tax ID / Commercial Register'}
              placeholder="100-234-567"
              value={demoInputVal}
              onChange={(e) => setDemoInputVal(e.target.value)}
              onBlur={handleDemoValidate}
              error={demoInputError}
              hint={isArabic ? 'اترك الحقل فارغاً وانقر خارجه لاختبار رسالة التحقق المحاسبية' : 'Leave empty and blur to inspect validation appearance'}
            />

            <div className="flex items-center justify-between pt-2">
              <Checkbox
                label={isArabic ? 'تذكر بيانات الدخول' : 'Remember my credentials'}
                checked={checkedBox}
                onChange={(e) => setCheckedBox(e.target.checked)}
              />
              <Button variant="ghost">
                {isArabic ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}
              </Button>
            </div>
          </div>
        </section>

        <Divider />

        {/* 6. ACCOUNTING PRIMITIVES & LEDGER VOCABULARY */}
        <section className="space-y-8">
          <div>
            <h2 className="font-kufi text-2xl sm:text-3xl font-bold text-ink-900">
              {t('accountingPrimitivesTitle')}
            </h2>
            <p className="text-[15px] text-ink-600 max-w-3xl mt-1 leading-arabic">
              {t('accountingPrimitivesDesc')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Dotted Leader Rows */}
            <div className="p-6 rounded-card bg-white border border-border space-y-4 shadow-card">
              <h4 className="font-kufi text-[16px] font-bold text-ink-900">
                {isArabic ? 'الروابط النقطية المحاسبية' : 'Dotted Accounting Leaders'}
              </h4>
              <div className="space-y-1">
                <LeaderRow
                  label={isArabic ? 'إجمالي المشتريات الشهرية' : 'Monthly Gross Purchases'}
                  value={<Money amount={1420500} />}
                />
                <LeaderRow
                  label={isArabic ? 'مردودات ومسموحات المشتريات' : 'Purchase Returns & Allowances'}
                  value={<Money amount={-42000} />}
                />
                <LeaderRow
                  label={isArabic ? 'أرصدة البنوك والشيكات تحت التحصيل' : 'Uncleared Cheques Schedule'}
                  value={<Money amount={890000} />}
                  sublabel={isArabic ? 'تمت المطابقة مع كشف بنك مصر' : 'Reconciled with Banque Misr statement'}
                />
                <Divider variant="double" />
                <LeaderRow
                  label={isArabic ? 'صافي المركز المالي المتاح' : 'Net Available Position'}
                  value={<Money amount={2268500} />}
                />
              </div>
            </div>

            {/* Accordion FAQ Specimen */}
            <div className="p-6 rounded-card bg-white border border-border space-y-4 shadow-card">
              <h4 className="font-kufi text-[16px] font-bold text-ink-900">
                {isArabic ? 'الأسئلة الشائعة المطوية' : 'Accordion FAQ Section'}
              </h4>
              <Accordion type="single" collapsible defaultValue="item-1">
                <AccordionItem value="item-1">
                  <AccordionTrigger>
                    {isArabic ? 'هل أستطيع نقل بياناتي الحالية من Excel؟' : 'Can I import my data from Excel?'}
                  </AccordionTrigger>
                  <AccordionContent>
                    {isArabic
                      ? 'نعم، تستطيع استيراد دليل الحسابات وأرصدة أول المدة وبيانات العملاء والموردين عبر ملفات Excel جاهزة بضغطة زر واحدة.'
                      : 'Yes, you can import your chart of accounts, opening balances, customers, and suppliers directly from prepared Excel templates.'}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>
                    {isArabic ? 'هل يدعم الفاتورة الإلكترونية لمنظومة الضرائب؟' : 'Does it support ETA e-invoicing?'}
                  </AccordionTrigger>
                  <AccordionContent>
                    {isArabic
                      ? 'التكامل مع منظومة الفاتورة والإيصال الإلكتروني لمصلحة الضرائب المصرية قادم قريباً في تحديث لاحق.'
                      : 'Integration with the Egyptian Tax Authority (ETA) e-invoicing and e-receipt systems is coming soon in an upcoming release.'}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>

          {/* Toast & Image Slot Demonstrations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
            <div className="p-6 rounded-card bg-white border border-border space-y-4 shadow-card">
              <h4 className="font-kufi text-[16px] font-bold text-ink-900">
                {isArabic ? 'إشعارات النظام' : 'System Notification Toasts'}
              </h4>
              <div className="space-y-3">
                <Toast
                  type="success"
                  title={isArabic ? 'تم ترحيل القيد بنجاح' : 'Journal Entry Posted'}
                  message={isArabic ? 'القيد #1042 متزن ومسجل في دفتر الأستاذ العام.' : 'Entry #1042 is balanced and recorded in the general ledger.'}
                />
                <Toast
                  type="warning"
                  title={isArabic ? 'تنبيه نسبة الفاقد في الثلاجة' : 'Cold-Storage Shrinkage Alert'}
                  message={isArabic ? 'تجاوز لوط البطاطس #401 حد الفاقد المسموح به (3.2%).' : 'Potato lot #401 exceeded allowed shrinkage threshold (3.2%).'}
                />
              </div>
            </div>

            <div className="p-6 rounded-card bg-white border border-border space-y-4 shadow-card">
              <h4 className="font-kufi text-[16px] font-bold text-ink-900">
                {isArabic ? 'خانات الصور المجهزة' : 'Prepared Image Slot with Fallback'}
              </h4>
              <div className="h-44 rounded-btn overflow-hidden relative">
                <ImageSlot
                  src="/images/hero-desk.jpg"
                  alt="مكتب المحاسب المصري عند الغسق"
                  fallbackLabel={isArabic ? 'خلفية الدفاتر الداكنة' : 'Dark ledger fallback'}
                  containerClassName="w-full h-full"
                  fill
                  priority
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        <Divider />

        {/* 7. GENERATED BRAND IMAGERY SHOWCASE */}
        <section className="space-y-8">
          <div>
            <h2 className="font-kufi text-2xl sm:text-3xl font-bold text-ink-900">
              {isArabic ? 'معرض الصور الفوتوغرافية المولدة' : 'Bespoke Photographic Brand Imagery'}
            </h2>
            <p className="text-[15px] text-ink-600 max-w-3xl mt-1 leading-arabic">
              {isArabic
                ? 'صور فوتوغرافية وثائقية بظلال خضراء صنوبرية وإضاءة بيضاء دافئة، خالية تماماً من الوجوه والعناصر المصطنعة.'
                : 'Documentary photography with deep pine-green shadows and warm white highlights, strictly avoiding faces and stock tropes.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Hero Desk */}
            <div className="p-4 rounded-card bg-white border border-border space-y-3 shadow-card">
              <div className="relative h-64 rounded-btn overflow-hidden bg-green-950">
                <img
                  src="/images/hero-desk.jpg"
                  alt="مكتب المحاسب المصري عند الغسق"
                  className="w-full h-full object-cover"
                  loading="eager"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="font-kufi text-[14px] font-bold text-ink-900">
                  {isArabic ? 'مكتب المحاسب المصري عند الغسق' : 'Egyptian Accountant Desk at Dusk'}
                </span>
                <span className="text-[12px] font-mono text-ink-600"><bdi dir="ltr">hero-desk.jpg (16:9)</bdi></span>
              </div>
            </div>

            {/* Cold Storage */}
            <div className="p-4 rounded-card bg-white border border-border space-y-3 shadow-card">
              <div className="relative h-64 rounded-btn overflow-hidden bg-green-950">
                <img
                  src="/images/storage.jpg"
                  alt="عنابر ثلاجات التخزين الزراعي"
                  className="w-full h-full object-cover"
                  loading="eager"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="font-kufi text-[14px] font-bold text-ink-900">
                  {isArabic ? 'ثلاجات التخزين والتبريد والبطاطس' : 'Cold Storage & Produce Warehouse'}
                </span>
                <span className="text-[12px] font-mono text-ink-600"><bdi dir="ltr">storage.jpg (3:2)</bdi></span>
              </div>
            </div>

            {/* Receipts */}
            <div className="p-4 rounded-card bg-white border border-border space-y-3 shadow-card">
              <div className="relative h-64 rounded-btn overflow-hidden bg-green-950">
                <img
                  src="/images/receipts.jpg"
                  alt="فواتير وسندات مع مشبك وقلم نحاسي"
                  className="w-full h-full object-cover"
                  loading="eager"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="font-kufi text-[14px] font-bold text-ink-900">
                  {isArabic ? 'سندات وفواتير مع مشبك وقلم' : 'Vouchers with Brass Paperclip & Pen'}
                </span>
                <span className="text-[12px] font-mono text-ink-600"><bdi dir="ltr">receipts.jpg (4:3)</bdi></span>
              </div>
            </div>

            {/* Ledger Texture */}
            <div className="p-4 rounded-card bg-white border border-border space-y-3 shadow-card">
              <div className="relative h-64 rounded-btn overflow-hidden bg-green-950">
                <img
                  src="/images/ledger-texture.jpg"
                  alt="ملمس ورق الدفاتر المحاسبية المخططة"
                  className="w-full h-full object-cover"
                  loading="eager"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="font-kufi text-[14px] font-bold text-ink-900">
                  {isArabic ? 'تسطير ورق الدفاتر المحاسبية المتقن' : 'Vintage Ruled Ledger Paper Texture'}
                </span>
                <span className="text-[12px] font-mono text-ink-600"><bdi dir="ltr">ledger-texture.jpg (1:1)</bdi></span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
