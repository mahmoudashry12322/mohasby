import { NAV_GROUPS, NavGroup, NavItem } from './nav.config';

/**
 * Normalizes Arabic and Latin strings for robust search.
 * - Strips diacritics (harakat) and tatweel (kashida).
 * - Folds hamzas (أ, إ, آ, ٱ -> ا).
 * - Folds alif maqsura (ى -> ي).
 * - Folds tah marbuta (ة -> ه).
 * - Maps Arabic-Indic digits (٠-٩) to Western digits (0-9).
 * - Lowercases Latin text and trims whitespace.
 */
export function normalizeSearchText(text: string): string {
  if (!text) return '';

  const arabicIndicDigits: Record<string, string> = {
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
  };

  return text
    // Normalize unicode composition
    .normalize('NFD')
    // Remove Arabic diacritics (harakat & dagger alif)
    .replace(/[\u064B-\u065F\u0670]/g, '')
    // Remove Tatweel / Kashida
    .replace(/\u0640/g, '')
    // Fold Hamzas to plain Alif
    .replace(/[أإآٱ]/g, 'ا')
    // Fold Alif Maqsura to Yaa
    .replace(/ى/g, 'ي')
    // Fold Tah Marbuta to Haa
    .replace(/ة/g, 'ه')
    // Convert Arabic-Indic digits to 0-9
    .replace(/[٠-٩]/g, (digit) => arabicIndicDigits[digit] || digit)
    .toLowerCase()
    .trim();
}

export type SearchResultItem = {
  group: NavGroup;
  item: NavItem;
  labelAr: string;
  labelEn: string;
  descAr: string;
  descEn: string;
  score: number;
};

export function searchNavItems(
  query: string,
  messagesAr: any,
  messagesEn: any
): SearchResultItem[] {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return [];

  const results: SearchResultItem[] = [];

  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      const labelAr = messagesAr?.nav?.items?.[item.labelKey] || '';
      const labelEn = messagesEn?.nav?.items?.[item.labelKey] || '';
      const descAr = messagesAr?.nav?.descriptions?.[item.descriptionKey] || '';
      const descEn = messagesEn?.nav?.descriptions?.[item.descriptionKey] || '';
      const groupLabelAr = messagesAr?.nav?.groups?.[group.labelKey] || '';
      const groupLabelEn = messagesEn?.nav?.groups?.[group.labelKey] || '';

      const normLabelAr = normalizeSearchText(labelAr);
      const normLabelEn = normalizeSearchText(labelEn);
      const normDescAr = normalizeSearchText(descAr);
      const normDescEn = normalizeSearchText(descEn);
      const normGroupAr = normalizeSearchText(groupLabelAr);
      const normGroupEn = normalizeSearchText(groupLabelEn);

      let score = 0;

      // Exact or prefix matches on titles get highest score
      if (normLabelAr === normalizedQuery || normLabelEn === normalizedQuery) {
        score += 100;
      } else if (normLabelAr.startsWith(normalizedQuery) || normLabelEn.startsWith(normalizedQuery)) {
        score += 60;
      } else if (normLabelAr.includes(normalizedQuery) || normLabelEn.includes(normalizedQuery)) {
        score += 40;
      } else if (normGroupAr.includes(normalizedQuery) || normGroupEn.includes(normalizedQuery)) {
        score += 20;
      } else if (normDescAr.includes(normalizedQuery) || normDescEn.includes(normalizedQuery)) {
        score += 10;
      }

      if (score > 0) {
        results.push({
          group,
          item,
          labelAr,
          labelEn,
          descAr,
          descEn,
          score,
        });
      }
    }
  }

  // Sort by highest score first
  return results.sort((a, b) => b.score - a.score);
}
