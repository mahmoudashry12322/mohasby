'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { Logo } from '@/components/brand/Logo';
import { LogIn, Menu, X, Sparkles } from 'lucide-react';

interface NavbarProps {
  onOpenDemo?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenDemo }) => {
  const t = useTranslations('nav');
  const locale = useLocale();
  const isAr = locale === 'ar';

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: t('modules'), href: '#modules' },
    { name: t('excelVsLedger'), href: '#excel' },
    { name: t('hierarchy'), href: '#hierarchy' },
    { name: t('diagnostic'), href: '#diagnostic' },
    { name: t('heritage'), href: '#heritage' },
    { name: t('testimonials'), href: '#testimonials' },
    { name: t('enterprise'), href: '#enterprise' },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-md border-b border-border py-3 shadow-[0_4px_20px_rgba(7,28,24,0.06)]'
            : 'bg-white/90 backdrop-blur-sm border-b border-border/50 py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between gap-4">
          
          {/* Brand Logo & Wordmark */}
          <Link href={`/${locale}`} className="flex-shrink-0 flex items-center gap-3">
            <Logo theme="green" markSize={isScrolled ? 28 : 34} />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-6 2xl:gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="group relative text-xs font-semibold text-ink-900/80 hover:text-green-700 transition-colors duration-300 py-1"
              >
                <span>{link.name}</span>
                <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-green-700 transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            
            {/* Login Link */}
            <Link
              href={`/${locale}/login`}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-ink-900 hover:text-green-700 hover:bg-green-100/50 text-xs font-medium transition-all"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{t('login')}</span>
            </Link>

            {/* Primary Accent CTA Button (Desktop only in top bar) */}
            <button
              onClick={onOpenDemo}
              className="hidden sm:inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-green-700 hover:bg-green-800 text-white font-bold text-xs shadow-[0_2px_12px_rgba(31,78,66,0.25)] hover:shadow-[0_4px_20px_rgba(31,78,66,0.35)] transition-all duration-300 active:scale-95 shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span>{t('cta')}</span>
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="xl:hidden p-2 rounded-lg text-ink-900 hover:bg-gray-100 transition-colors"
              aria-label="Toggle Menu"
            >
              {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-30 bg-white/98 backdrop-blur-xl pt-24 px-6 pb-8 flex flex-col justify-between xl:hidden animate-fade-in shadow-2xl border-b border-border">
          <div className="space-y-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileOpen(false)}
                className="block text-base font-semibold text-ink-900 hover:text-green-700 py-2 border-b border-border/50 transition-colors"
              >
                {link.name}
              </a>
            ))}
          </div>

          <div className="space-y-3 pt-6 border-t border-border">
            <Link
              href={`/${locale}/login`}
              onClick={() => setIsMobileOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-border text-ink-900 text-sm font-medium hover:bg-canvas"
            >
              <LogIn className="w-4 h-4" />
              <span>{t('login')}</span>
            </Link>

            <button
              onClick={() => {
                setIsMobileOpen(false);
                onOpenDemo?.();
              }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-green-700 hover:bg-green-800 text-white font-bold text-sm shadow-md"
            >
              <Sparkles className="w-4 h-4" />
              <span>{t('cta')}</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
