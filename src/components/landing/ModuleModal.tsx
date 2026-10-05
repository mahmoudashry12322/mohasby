'use client';

import React from 'react';
import { ModuleItem } from './CoreModules';
import { X, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { useLocale } from 'next-intl';

interface ModuleModalProps {
  module: ModuleItem | null;
  onClose: () => void;
  onOpenDemo: () => void;
}

export const ModuleModal: React.FC<ModuleModalProps> = ({ module, onClose, onOpenDemo }) => {
  const locale = useLocale();
  const isAr = locale === 'ar';

  if (!module) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-border space-y-6 text-start text-ink-900">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-full hover:bg-canvas text-ink-600 transition-colors"
          aria-label="Close Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-2 pr-8">
          <span className="px-3 py-1 rounded-full bg-emerald-50 text-green-700 text-xs font-bold border border-emerald-200">
            {module.badge}
          </span>
          <h3 className="font-kufi font-bold text-xl sm:text-2xl text-ink-900">
            {module.title}
          </h3>
          <p className="text-xs sm:text-sm text-green-700 font-semibold">
            {module.subtitle}
          </p>
        </div>

        {/* Description */}
        <p className="text-xs sm:text-sm text-ink-600 leading-relaxed">
          {module.description}
        </p>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-canvas border border-border">
          {module.metrics.map((m, idx) => (
            <div key={idx} className="space-y-1">
              <span className="text-[11px] text-ink-600 block">{m.label}</span>
              <span className="text-sm font-bold text-green-700 block font-mono">{m.value}</span>
            </div>
          ))}
        </div>

        {/* Compliance Note */}
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-green-800 text-xs flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-green-700 shrink-0" />
          <span>{module.highlight}</span>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-border text-ink-600 hover:text-ink-900 text-xs font-medium transition-colors"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenDemo();
            }}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-green-700 hover:bg-green-800 text-white font-bold text-xs transition-all shadow-md shadow-green-700/20 flex items-center justify-center gap-2"
          >
            <span>{isAr ? 'طلب تجربة هذه الوحدة' : 'Request Module Demo'}</span>
            <ArrowRight className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
          </button>
        </div>

      </div>
    </div>
  );
};
