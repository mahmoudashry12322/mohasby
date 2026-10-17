'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type PwaPlatform = 'ios' | 'android' | 'desktop';

interface PwaContextType {
  isInstalled: boolean;
  canInstall: boolean;
  platform: PwaPlatform;
  showBanner: boolean;
  isIosModalOpen: boolean;
  isSuccessToastOpen: boolean;
  setIsIosModalOpen: (v: boolean) => void;
  setIsSuccessToastOpen: (v: boolean) => void;
  installApp: () => Promise<boolean>;
  dismissBanner: () => void;
  showInstallPrompt: () => void;
}

const PwaContext = createContext<PwaContextType | null>(null);

export const PwaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [canInstall, setCanInstall] = useState<boolean>(false);
  const [platform, setPlatform] = useState<PwaPlatform>('desktop');
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const [promptEvent, setPromptEvent] = useState<any>(null);
  const [isIosModalOpen, setIsIosModalOpen] = useState<boolean>(false);
  const [isSuccessToastOpen, setIsSuccessToastOpen] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Detect platform
    const ua = navigator.userAgent || '';
    const isIos = /iPhone|iPad|iPod/i.test(ua) && !(window as any).MSStream;
    const isAndroid = /Android/i.test(ua);
    const detectedPlatform: PwaPlatform = isIos ? 'ios' : isAndroid ? 'android' : 'desktop';
    setPlatform(detectedPlatform);

    // 2. Check if already running in standalone mode (already installed & opened from home screen / desktop shortcut)
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    if (isStandaloneMode) {
      setIsInstalled(true);
      setShowBanner(false);
      document.documentElement.style.setProperty('--pwa-banner-height', '0px');
      return;
    }

    // 3. If in standalone mode, user is already using the installed window -> hide banner
    // If in normal browser tab, keep the option visible unless user explicitly clicked (X) to dismiss
    const dismissedAt = localStorage.getItem('mohasby_pwa_dismissed_at');
    if (dismissedAt) {
      const hoursPassed = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60);
      if (hoursPassed < 48) {
        setShowBanner(false);
      } else {
        setShowBanner(true);
      }
    } else {
      setShowBanner(true);
    }

    // iOS devices can always show install instructions
    if (isIos) {
      setCanInstall(true);
    }

    // 5. Intercept beforeinstallprompt for Chrome / Edge / Android
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e);
      setCanInstall(true);
      // If user hasn't installed, ensure banner is displayed
      const stored = localStorage.getItem('mohasby_pwa_installed');
      if (stored !== 'true') {
        const dismissed = localStorage.getItem('mohasby_pwa_dismissed_at');
        if (!dismissed) {
          setShowBanner(true);
        }
      }
    };

    // 6. Listen for appinstalled
    const handleAppInstalled = () => {
      localStorage.setItem('mohasby_pwa_installed', 'true');
      setIsInstalled(true);
      setShowBanner(false);
      setPromptEvent(null);
      document.documentElement.style.setProperty('--pwa-banner-height', '0px');
      setIsSuccessToastOpen(true);
      setTimeout(() => setIsSuccessToastOpen(false), 5000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // 7. Register Service Worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            // Check for updates
            reg.onupdatefound = () => {
              const installingWorker = reg.installing;
              if (installingWorker) {
                installingWorker.onstatechange = () => {
                  if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('New PWA version available');
                  }
                };
              }
            };
          })
          .catch((err) => {
            console.debug('PWA Service Worker register notice:', err);
          });
      });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Update root CSS variable when banner visibility changes
  useEffect(() => {
    if (showBanner && !isInstalled) {
      const height = platform === 'desktop' ? '48px' : '54px';
      document.documentElement.style.setProperty('--pwa-banner-height', height);
    } else {
      document.documentElement.style.setProperty('--pwa-banner-height', '0px');
    }
  }, [showBanner, isInstalled, platform]);

  const dismissBanner = useCallback(() => {
    setShowBanner(false);
    localStorage.setItem('mohasby_pwa_dismissed_at', Date.now().toString());
    document.documentElement.style.setProperty('--pwa-banner-height', '0px');
  }, []);

  const showInstallPrompt = useCallback(() => {
    setShowBanner(true);
  }, []);

  const installApp = useCallback(async (): Promise<boolean> => {
    if (platform === 'ios') {
      setIsIosModalOpen(true);
      return false;
    }

    if (promptEvent) {
      promptEvent.prompt();
      const choiceResult = await promptEvent.userChoice;
      if (choiceResult.outcome === 'accepted') {
        localStorage.setItem('mohasby_pwa_installed', 'true');
        setIsInstalled(true);
        setShowBanner(false);
        setPromptEvent(null);
        document.documentElement.style.setProperty('--pwa-banner-height', '0px');
        setIsSuccessToastOpen(true);
        setTimeout(() => setIsSuccessToastOpen(false), 5000);
        return true;
      }
      return false;
    }

    // Fallback if browser supports manual install or hasn't fired prompt yet
    setIsIosModalOpen(true);
    return false;
  }, [platform, promptEvent]);

  return (
    <PwaContext.Provider
      value={{
        isInstalled,
        canInstall,
        platform,
        showBanner,
        isIosModalOpen,
        isSuccessToastOpen,
        setIsIosModalOpen,
        setIsSuccessToastOpen,
        installApp,
        dismissBanner,
        showInstallPrompt,
      }}
    >
      {children}
    </PwaContext.Provider>
  );
};

export const usePwa = () => {
  const context = useContext(PwaContext);
  if (!context) {
    throw new Error('usePwa must be used within a PwaProvider');
  }
  return context;
};
