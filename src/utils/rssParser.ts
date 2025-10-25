import Parser from 'rss-parser';
import type { Article, RSSSource, FetchResult } from '../types';

const parser = new Parser({
  customFields: {
    item: ['content:encoded', 'content'],
  },
});

// CORS proxy options
const CORS_PROXIES = [
  'https://api.allorigins.win/get?url=',
  'https://corsproxy.io/?',
];

let currentProxyIndex = 0;

function getProxyUrl(url: string): string {
  const proxy = CORS_PROXIES[currentProxyIndex];
  return `${proxy}${encodeURIComponent(url)}`;
}

function rotateProxy() {
  currentProxyIndex = (currentProxyIndex + 1) % CORS_PROXIES.length;
}

export async function fetchRSS(source: RSSSource): Promise<FetchResult> {
  let lastError: Error | null = null;

  // Try with each proxy
  for (let i = 0; i < CORS_PROXIES.length; i++) {
    try {
      const proxyUrl = getProxyUrl(source.url);
      const response = await fetch(proxyUrl);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      let xmlText: string;

      // Handle different proxy response formats
      if (proxyUrl.includes('allorigins')) {
        const json = await response.json();
        xmlText = json.contents;
      } else {
        xmlText = await response.text();
      }

      const feed = await parser.parseString(xmlText);

      // Convert feed items to our Article format
      const articles: Article[] = feed.items.map((item) => ({
        id: generateArticleId(item.link || '', item.pubDate || ''),
        sourceId: source.id,
        title: item.title || 'Untitled',
        content: item['content:encoded'] || item.content || item.contentSnippet || '',
        contentSnippet: item.contentSnippet || '',
        pubDate: item.pubDate || new Date().toISOString(),
        link: item.link || '',
        creator: item.creator,
        categories: item.categories,
        isRead: false,
      }));

      return {
        success: true,
        sourceId: source.id,
        articlesCount: articles.length,
      };
    } catch (error) {
      lastError = error as Error;
      rotateProxy();
      // Continue to next proxy
    }
  }

  return {
    success: false,
    sourceId: source.id,
    articlesCount: 0,
    error: lastError?.message || 'Failed to fetch RSS',
  };
}

export async function fetchAllRSS(sources: RSSSource[]): Promise<FetchResult[]> {
  // Fetch with concurrency limit
  const CONCURRENCY_LIMIT = 3;
  const results: FetchResult[] = [];

  for (let i = 0; i < sources.length; i += CONCURRENCY_LIMIT) {
    const batch = sources.slice(i, i + CONCURRENCY_LIMIT);
    const batchResults = await Promise.all(
      batch.map((source) => fetchRSS(source))
    );
    results.push(...batchResults);
  }

  return results;
}

function generateArticleId(link: string, pubDate: string): string {
  const str = `${link}-${pubDate}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return `article-${Math.abs(hash)}`;
}

export function parseRSSContent(xmlText: string) {
  return parser.parseString(xmlText);
}
