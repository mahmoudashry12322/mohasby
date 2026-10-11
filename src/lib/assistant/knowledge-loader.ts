import fs from "fs";
import path from "path";

export interface KnowledgeArticle {
  key: string;
  filename: string;
  title: string;
  content: string;
}

// In-memory cache for loaded articles
let cachedArticles: KnowledgeArticle[] | null = null;

const KNOWLEDGE_DIR = path.join(
  process.cwd(),
  "src",
  "lib",
  "assistant",
  "knowledge",
);

/**
 * Loads and caches all knowledge base markdown articles.
 */
export function loadAllArticles(): KnowledgeArticle[] {
  if (cachedArticles) return cachedArticles;

  if (!fs.existsSync(KNOWLEDGE_DIR)) {
    return [];
  }

  const files = fs
    .readdirSync(KNOWLEDGE_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort();

  const articles: KnowledgeArticle[] = [];

  for (const file of files) {
    const fullPath = path.join(KNOWLEDGE_DIR, file);
    const content = fs.readFileSync(fullPath, "utf-8").trim();
    const key = file.replace(/\.md$/, "");

    // Extract title from first markdown header
    const firstLine = content.split("\n")[0] || "";
    const title = firstLine.replace(/^#+\s*/, "") || key;

    articles.push({
      key,
      filename: file,
      title,
      content,
    });
  }

  cachedArticles = articles;
  return articles;
}

/**
 * Clears the article cache (useful in tests).
 */
export function clearArticleCache(): void {
  cachedArticles = null;
}

/**
 * Estimates token count using heuristic: ~4 characters per token for Arabic/English mixed text.
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 3.5);
}

/**
 * Maps a route slug or query to relevant knowledge article keys.
 */
function getRelevantArticleKeys(route: string, query: string): Set<string> {
  const keys = new Set<string>();
  const normalizedRoute = route.toLowerCase();
  const normalizedQuery = query.toLowerCase();

  // Route matches
  if (normalizedRoute.includes("journal") || normalizedRoute.includes("opening")) {
    keys.add("journal-entries");
    keys.add("chart-of-accounts");
  }
  if (normalizedRoute.includes("chart") || normalizedRoute.includes("account")) {
    keys.add("chart-of-accounts");
    keys.add("ledger");
  }
  if (normalizedRoute.includes("ledger") || normalizedRoute.includes("statement")) {
    keys.add("ledger");
    keys.add("trial-balance");
  }
  if (normalizedRoute.includes("trial") || normalizedRoute.includes("balance-sheet") || normalizedRoute.includes("income")) {
    keys.add("trial-balance");
    keys.add("financial-statements");
  }
  if (normalizedRoute.includes("warehouse") || normalizedRoute.includes("stock") || normalizedRoute.includes("cold")) {
    keys.add("inventory");
  }
  if (normalizedRoute.includes("bank") || normalizedRoute.includes("treasury") || normalizedRoute.includes("cheque")) {
    keys.add("banks-cash-cheques");
  }
  if (normalizedRoute.includes("cost")) {
    keys.add("cost-centers");
    keys.add("specialized-activities");
  }
  if (normalizedRoute.includes("farm") || normalizedRoute.includes("manufacturing") || normalizedRoute.includes("import") || normalizedRoute.includes("animal")) {
    keys.add("specialized-activities");
  }

  // Keyword matches from user query
  if (/قيد|قيود|مدين|دائن|توازن/.test(normalizedQuery)) keys.add("journal-entries");
  if (/حساب|شجرة|دليل|أصول|خصوم/.test(normalizedQuery)) keys.add("chart-of-accounts");
  if (/أستاذ|كشف حساب/.test(normalizedQuery)) keys.add("ledger");
  if (/ميزان|مراجعة/.test(normalizedQuery)) keys.add("trial-balance");
  if (/مخزن|مخازن|بضاعة|صنف|تبريد|هالك/.test(normalizedQuery)) keys.add("inventory");
  if (/بنك|خزينة|شيك|شيكات|تسوية/.test(normalizedQuery)) keys.add("banks-cash-cheques");
  if (/مركز تكلفة|مراكز/.test(normalizedQuery)) keys.add("cost-centers");
  if (/مزرعة|بيفوت|تصنيع|تسمين|وزن|استيراد/.test(normalizedQuery)) keys.add("specialized-activities");
  if (/أرباح|خسائر|ميزانية|تدفق|قوائم/.test(normalizedQuery)) keys.add("financial-statements");
  if (/خطأ|مشكلة|عجز|فرق/.test(normalizedQuery)) keys.add("faq-troubleshooting");
  if (/صلاحية|دور|أدوار|مراجع|محاسب|مدير/.test(normalizedQuery)) keys.add("roles-and-permissions");

  return keys;
}

/**
 * Returns contextual knowledge content formatted for system prompt injection.
 * Always includes getting-started and roles-and-permissions, plus topically selected or all articles.
 */
export function getKnowledge(options?: {
  currentRoute?: string;
  query?: string;
  maxTokens?: number;
}): {
  content: string;
  estimatedTokens: number;
  loadedTopics: string[];
} {
  const articles = loadAllArticles();
  const maxTokens = options?.maxTokens || 1600; // Stay well below Groq's 8K TPM

  const route = options?.currentRoute || "";
  const query = options?.query || "";
  const relevantKeys = getRelevantArticleKeys(route, query);

  // Always essential base articles
  const essentialKeys = new Set(["getting-started", "roles-and-permissions"]);

  // Sort articles: relevant first (5), then essential (2), then others
  const prioritized = [...articles].sort((a, b) => {
    const aPri = (relevantKeys.has(a.key) ? 5 : 0) + (essentialKeys.has(a.key) ? 2 : 0);
    const bPri = (relevantKeys.has(b.key) ? 5 : 0) + (essentialKeys.has(b.key) ? 2 : 0);
    return bPri - aPri;
  });

  const selectedChunks: string[] = [];
  const loadedTopics: string[] = [];
  let currentTokens = 0;

  for (const article of prioritized) {
    const section = `\n\n--- [وثيقة: ${article.title}] ---\n${article.content}`;
    const sectionTokens = estimateTokens(section);

    if (currentTokens + sectionTokens > maxTokens && selectedChunks.length > 0) {
      // Don't exceed budget
      continue;
    }

    selectedChunks.push(section);
    loadedTopics.push(article.key);
    currentTokens += sectionTokens;
  }

  const content = selectedChunks.join("\n");
  return {
    content,
    estimatedTokens: currentTokens,
    loadedTopics,
  };
}
