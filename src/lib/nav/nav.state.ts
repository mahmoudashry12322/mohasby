export type NavState = {
  collapsed: boolean;
  openGroups: string[];
};

export const DEFAULT_NAV_STATE: NavState = {
  collapsed: false,
  openGroups: ['accounting'],
};

export const NAV_COOKIE_NAME = 'mohasby_nav';

export function parseNavCookie(cookieValue?: string): NavState {
  if (!cookieValue) return DEFAULT_NAV_STATE;
  try {
    const parsed = JSON.parse(decodeURIComponent(cookieValue));
    return {
      collapsed: Boolean(parsed.collapsed),
      openGroups: Array.isArray(parsed.openGroups) ? parsed.openGroups : DEFAULT_NAV_STATE.openGroups,
    };
  } catch {
    return DEFAULT_NAV_STATE;
  }
}

export function serializeNavCookie(state: NavState): string {
  return encodeURIComponent(JSON.stringify(state));
}

export function setNavStateCookie(state: NavState): void {
  if (typeof document === 'undefined') return;
  const serialized = serializeNavCookie(state);
  const maxAge = 365 * 24 * 60 * 60; // 1 year
  document.cookie = `${NAV_COOKIE_NAME}=${serialized}; path=/; max-age=${maxAge}; SameSite=Lax`;
}
