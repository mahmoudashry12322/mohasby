'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Hero } from '@/components/landing/Hero';
import { MarqueeStrip } from '@/components/landing/MarqueeStrip';
import { CoreModules, ModuleItem } from '@/components/landing/CoreModules';
import { ExcelComparison } from '@/components/landing/ExcelComparison';
import { AccountingHierarchy } from '@/components/landing/AccountingHierarchy';
import { SectorDiagnostic } from '@/components/landing/SectorDiagnostic';
import { AuditHeritage } from '@/components/landing/AuditHeritage';
import { AuditorTestimonials } from '@/components/landing/AuditorTestimonials';
import { EnterpriseReserve } from '@/components/landing/EnterpriseReserve';
import { Footer } from '@/components/layout/Footer';
import { ModuleModal } from '@/components/landing/ModuleModal';
import { DemoModal } from '@/components/landing/DemoModal';

export default function HomePage() {
  const [selectedModule, setSelectedModule] = useState<ModuleItem | null>(null);
  const [isDemoOpen, setIsDemoOpen] = useState<boolean>(false);

  return (
    <main className="min-h-screen bg-canvas text-ink-900 relative selection:bg-accent-500/25 selection:text-green-950">
      {/* 1. Global Navigation */}
      <Navbar onOpenDemo={() => setIsDemoOpen(true)} />

      {/* 2. Hero Section with Media Background & Live Journal Voucher */}
      <Hero
        onOpenDemo={() => setIsDemoOpen(true)}
        onOpenVoucherDemo={() => setIsDemoOpen(true)}
      />

      {/* 3. Scrolling Marquee Ribbon */}
      <MarqueeStrip />

      {/* 4. Core Modules Showcase */}
      <CoreModules onSelectModule={(mod) => setSelectedModule(mod)} />

      {/* 5. Interactive Feature Spotlight: Excel vs Balanced Ledger */}
      <ExcelComparison onOpenDemo={() => setIsDemoOpen(true)} />

      {/* 6. Three-Tier Fiscal Architecture Pyramid */}
      <AccountingHierarchy />

      {/* 7. Interactive Sector Diagnostic Tool */}
      <SectorDiagnostic onOpenDemo={() => setIsDemoOpen(true)} />

      {/* 8. Audit Heritage & Cold Storage Craftsmanship */}
      <AuditHeritage />

      {/* 9. Certified Auditor & CFO Reviews */}
      <AuditorTestimonials />

      {/* 10. VIP Enterprise Onboarding & Consultation */}
      <EnterpriseReserve />

      {/* 11. Luxury Comprehensive Footer */}
      <Footer />

      {/* 12. Interactive Global Modals */}
      <ModuleModal
        module={selectedModule}
        onClose={() => setSelectedModule(null)}
        onOpenDemo={() => setIsDemoOpen(true)}
      />

      <DemoModal
        isOpen={isDemoOpen}
        onClose={() => setIsDemoOpen(false)}
      />
    </main>
  );
}
