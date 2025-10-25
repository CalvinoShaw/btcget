import type { Article, RSSSource, FetchResult } from '../types';

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

// 浏览器原生XML解析
function parseRSSXML(xmlText: string): any {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

  // 检查解析错误
  const parseError = xmlDoc.querySelector('parsererror');
  if (parseError) {
    throw new Error('XML parsing error');
  }

  const items: any[] = [];

  // 尝试RSS 2.0格式
  const rssItems = xmlDoc.querySelectorAll('item');
  if (rssItems.length > 0) {
    rssItems.forEach((item) => {
      items.push({
        title: item.querySelector('title')?.textContent || '',
        link: item.querySelector('link')?.textContent || '',
        pubDate: item.querySelector('pubDate')?.textContent || '',
        description: item.querySelector('description')?.textContent || '',
        content: item.querySelector('content\\:encoded, encoded')?.textContent ||
                 item.querySelector('description')?.textContent || '',
        contentSnippet: item.querySelector('description')?.textContent || '',
        creator: item.querySelector('dc\\:creator, creator')?.textContent || '',
        categories: Array.from(item.querySelectorAll('category')).map(
          (cat) => cat.textContent || ''
        ),
      });
    });
  } else {
    // 尝试Atom格式
    const atomEntries = xmlDoc.querySelectorAll('entry');
    atomEntries.forEach((entry) => {
      const linkEl = entry.querySelector('link');
      items.push({
        title: entry.querySelector('title')?.textContent || '',
        link: linkEl?.getAttribute('href') || '',
        pubDate: entry.querySelector('published, updated')?.textContent || '',
        description: entry.querySelector('summary')?.textContent || '',
        content: entry.querySelector('content')?.textContent ||
                 entry.querySelector('summary')?.textContent || '',
        contentSnippet: entry.querySelector('summary')?.textContent || '',
        creator: entry.querySelector('author name')?.textContent || '',
        categories: Array.from(entry.querySelectorAll('category')).map(
          (cat) => cat.getAttribute('term') || ''
        ),
      });
    });
  }

  return { items };
}

export async function fetchRSS(source: RSSSource, _articles: Article[]): Promise<FetchResult & { articles: Article[] }> {
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

      const feed = parseRSSXML(xmlText);

      // Convert feed items to our Article format
      const newArticles: Article[] = feed.items.map((item: any) => ({
        id: generateArticleId(item.link || '', item.pubDate || ''),
        sourceId: source.id,
        title: item.title || 'Untitled',
        content: item.content || item.contentSnippet || '',
        contentSnippet: item.contentSnippet || '',
        pubDate: item.pubDate || new Date().toISOString(),
        link: item.link || '',
        creator: item.creator,
        categories: item.categories?.filter((c: string) => c) || [],
        isRead: false,
      }));

      return {
        success: true,
        sourceId: source.id,
        articlesCount: newArticles.length,
        articles: newArticles,
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
    articles: [],
  };
}

export async function fetchAllRSS(sources: RSSSource[]): Promise<FetchResult[]> {
  // Fetch with concurrency limit
  const CONCURRENCY_LIMIT = 3;
  const results: FetchResult[] = [];

  for (let i = 0; i < sources.length; i += CONCURRENCY_LIMIT) {
    const batch = sources.slice(i, i + CONCURRENCY_LIMIT);
    const batchResults = await Promise.all(
      batch.map((source) => fetchRSS(source, []))
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
