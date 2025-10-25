import type { AppData, Article, RSSSource, Topic, AppSettings } from '../types';

const STORAGE_KEYS = {
  SOURCES: 'rss-reader-sources',
  ARTICLES: 'rss-reader-articles',
  TOPICS: 'rss-reader-topics',
  SETTINGS: 'rss-reader-settings',
};

// Load data from localStorage
export function loadSources(): RSSSource[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SOURCES);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading sources:', error);
    return [];
  }
}

export function loadArticles(): Article[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ARTICLES);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading articles:', error);
    return [];
  }
}

export function loadTopics(): Topic[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TOPICS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading topics:', error);
    return [];
  }
}

export function loadSettings(): AppSettings {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data
      ? JSON.parse(data)
      : {
          theme: 'light',
          autoRefreshInterval: 0,
          articlesPerPage: 20,
          defaultTimeRange: 7,
        };
  } catch (error) {
    console.error('Error loading settings:', error);
    return {
      theme: 'light',
      autoRefreshInterval: 0,
      articlesPerPage: 20,
      defaultTimeRange: 7,
    };
  }
}

// Save data to localStorage
export function saveSources(sources: RSSSource[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SOURCES, JSON.stringify(sources));
  } catch (error) {
    console.error('Error saving sources:', error);
    throw new Error('Failed to save sources');
  }
}

export function saveArticles(articles: Article[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(articles));
  } catch (error) {
    console.error('Error saving articles:', error);
    throw new Error('Failed to save articles');
  }
}

export function saveTopics(topics: Topic[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TOPICS, JSON.stringify(topics));
  } catch (error) {
    console.error('Error saving topics:', error);
    throw new Error('Failed to save topics');
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving settings:', error);
    throw new Error('Failed to save settings');
  }
}

// Merge articles (avoid duplicates)
export function mergeArticles(
  existing: Article[],
  newArticles: Article[]
): Article[] {
  const articleMap = new Map<string, Article>();

  // Add existing articles
  existing.forEach((article) => {
    articleMap.set(article.id, article);
  });

  // Add new articles (will overwrite if same ID)
  newArticles.forEach((article) => {
    if (!articleMap.has(article.id)) {
      articleMap.set(article.id, article);
    }
  });

  return Array.from(articleMap.values());
}

// Export all data
export function exportData(): AppData {
  return {
    sources: loadSources(),
    articles: loadArticles(),
    topics: loadTopics(),
    settings: loadSettings(),
  };
}

// Import data
export function importData(data: AppData): void {
  if (data.sources) saveSources(data.sources);
  if (data.articles) saveArticles(data.articles);
  if (data.topics) saveTopics(data.topics);
  if (data.settings) saveSettings(data.settings);
}

// Clear all data
export function clearAllData(): void {
  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });
}

// Check storage size
export function getStorageSize(): number {
  let total = 0;
  Object.values(STORAGE_KEYS).forEach((key) => {
    const item = localStorage.getItem(key);
    if (item) {
      total += item.length;
    }
  });
  return total;
}
