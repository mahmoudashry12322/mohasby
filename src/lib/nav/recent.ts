'use client';

import { useState, useEffect, useCallback } from 'react';
import { getNavItem, NavGroup, NavItem } from './nav.config';

export interface RecentPageEntry {
  groupSlug: string;
  pageSlug: string;
  timestamp: number;
}

export interface RecentPageDetail {
  group: NavGroup;
  item: NavItem;
}

const STORAGE_KEY = 'mohasby_recent_pages';
const MAX_RECENT = 5;
const RECENT_EVENT = 'mohasby:recent_updated';

export function getStoredRecentPages(): RecentPageDetail[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list: RecentPageEntry[] = JSON.parse(raw);
    if (!Array.isArray(list)) return [];

    const validDetails: RecentPageDetail[] = [];
    for (const entry of list) {
      if (!entry || !entry.groupSlug || !entry.pageSlug) continue;
      const matched = getNavItem(entry.groupSlug, entry.pageSlug);
      if (matched) {
        validDetails.push({
          group: matched.group,
          item: matched.item,
        });
      }
      if (validDetails.length >= MAX_RECENT) break;
    }
    return validDetails;
  } catch {
    return [];
  }
}

export function recordRecentPage(groupSlug: string, pageSlug: string): void {
  if (typeof window === 'undefined') return;
  try {
    const matched = getNavItem(groupSlug, pageSlug);
    if (!matched) return;

    const raw = localStorage.getItem(STORAGE_KEY);
    let list: RecentPageEntry[] = [];
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) list = parsed;
      } catch {
        list = [];
      }
    }

    // Filter out existing occurrence
    list = list.filter(
      (entry) => !(entry.groupSlug === groupSlug && entry.pageSlug === pageSlug)
    );

    // Prepend new entry
    list.unshift({
      groupSlug,
      pageSlug,
      timestamp: Date.now(),
    });

    // Cap at MAX_RECENT
    list = list.slice(0, MAX_RECENT);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event(RECENT_EVENT));
  } catch {
    // Fail silently in case of quota or security issues
  }
}

export function useRecentPages(): RecentPageDetail[] {
  const [recentPages, setRecentPages] = useState<RecentPageDetail[]>([]);

  const loadRecent = useCallback(() => {
    setRecentPages(getStoredRecentPages());
  }, []);

  useEffect(() => {
    loadRecent();

    const handleUpdate = () => loadRecent();
    window.addEventListener(RECENT_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(RECENT_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [loadRecent]);

  return recentPages;
}
