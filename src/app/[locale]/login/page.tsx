import React from 'react';
import type { Metadata } from 'next';
import { BrandPanel } from '@/components/auth/BrandPanel';
import { LoginForm } from '@/components/auth/LoginForm';

export const metadata: Metadata = {
  title: 'تسجيل الدخول — محاسبي',
  description: 'سجّل الدخول إلى دفتر حساباتك المتزن ومنظومة المخازن والتكاليف والضرائب.',
};

export default function LoginPage() {
  return (
    <main className="min-h-screen w-full bg-canvas flex flex-col lg:flex-row overflow-hidden">
      {/* 1. Brand Panel (52% on Desktop Start / Right in RTL) */}
      <div className="w-full lg:w-[52%] lg:min-h-screen shrink-0">
        <BrandPanel />
      </div>

      {/* 2. Form Panel (48% on Desktop End / Left in RTL) */}
      <div className="w-full lg:w-[48%] flex items-center justify-center p-4 sm:p-8 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-[0_10px_35px_rgba(7,28,24,0.06)] border border-border">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
