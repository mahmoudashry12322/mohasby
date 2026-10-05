'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { X, Sparkles, CheckCircle2, ShieldCheck, ArrowRight, UserCheck } from 'lucide-react';

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DemoModal: React.FC<DemoModalProps> = ({ isOpen, onClose }) => {
  const locale = useLocale();
  const isAr = locale === 'ar';

  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !phone) return;
    setIsSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-border space-y-6 text-start text-ink-900">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-full hover:bg-canvas text-ink-600 transition-colors"
          aria-label="Close Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {isSubmitted ? (
          <div className="text-center py-6 space-y-4 animate-fade-in">
            <CheckCircle2 className="w-12 h-12 text-success mx-auto" />
            <h3 className="font-kufi font-bold text-xl text-ink-900">
              {isAr ? 'تم تأكيد موعد العرض الحي' : 'Live Demo Request Confirmed'}
            </h3>
            <p className="text-xs sm:text-sm text-ink-600 leading-relaxed max-w-xs mx-auto">
              {isAr
                ? 'سيتصل بكم مستشار مالي مصري معتمد لترتيب جلسة الشرح وضبط دليل الحسابات.'
                : 'A senior Egyptian accounting specialist will contact you shortly to arrange the session.'}
            </p>

            <div className="pt-4 border-t border-border">
              <Link
                href={`/${locale}/login`}
                onClick={onClose}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-green-700 hover:bg-green-800 text-white font-bold text-xs transition-colors shadow-md"
              >
                <UserCheck className="w-4 h-4" />
                <span>{isAr ? 'الدخول التجريبي المباشر للنظام' : 'Access Instant Demo Account'}</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="space-y-1 pr-8">
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-green-700 text-xs font-bold border border-emerald-200">
                {isAr ? 'عرض عملي مباشر' : 'Live Interactive Demo'}
              </span>
              <h3 className="font-kufi font-bold text-xl sm:text-2xl text-ink-900">
                {isAr ? 'احجز جلستك المحاسبية الميدانية' : 'Book Your Financial Demo Session'}
              </h3>
              <p className="text-xs text-ink-600 leading-relaxed">
                {isAr
                  ? 'استعرض كيف تُدار أذونات اللوطات، القيود المزدوجة، وميزان المراجعة على بيانات حقيقية.'
                  : 'Experience how batch weighbridge tickets and strict journals operate on real Egyptian company data.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-ink-900 block">
                  {isAr ? 'اسم المنشأة أو المحطة' : 'Company or Station Name'}
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder={isAr ? 'مثال: محطة وادي النيل للحاصلات الزراعية' : 'e.g. Nile Valley Agricultural Packing'}
                  required
                  className="w-full p-3 rounded-xl border border-border bg-canvas focus:bg-white focus:outline-none focus:border-green-700 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-ink-900 block">
                  {isAr ? 'رقم الهاتف أو الواتساب' : 'Phone or WhatsApp Number'}
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="010XXXXXXXX"
                  required
                  className="w-full p-3 rounded-xl border border-border bg-canvas focus:bg-white focus:outline-none focus:border-green-700 transition-colors font-mono"
                />
              </div>

              <div className="p-3 rounded-xl bg-canvas border border-border text-[11px] text-ink-600 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-green-700 shrink-0" />
                <span>{isAr ? 'بياناتك مشفرة ومحمية بالكامل وفق معايير الخصوصية.' : 'Encrypted and strictly confidential under NDA.'}</span>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="submit"
                  className="w-full py-3.5 px-6 rounded-xl bg-green-700 hover:bg-green-800 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-green-700/20 transition-all"
                >
                  {isAr ? 'تأكيد طلب العرض الحي' : 'Confirm Demo Booking'}
                </button>
              </div>
            </form>

            <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-ink-600">
              <span>{isAr ? 'أو سجّل دخولك بحساب تجريبي:' : 'Or sign in with demo accounts:'}</span>
              <Link
                href={`/${locale}/login`}
                onClick={onClose}
                className="font-bold text-green-700 hover:underline flex items-center gap-1"
              >
                <span>{isAr ? 'بوابة تسجيل الدخول' : 'Sign In Portal'}</span>
                <ArrowRight className={`w-3 h-3 ${isAr ? 'rotate-180' : ''}`} />
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
