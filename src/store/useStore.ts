import { create } from 'zustand';
import type {
  Article,
  RSSSource,
  Topic,
  AppSettings,
  FetchResult,
} from '../types';
import {
  loadSources,
  loadArticles,
  loadTopics,
  loadSettings,
  saveSources,
  saveArticles,
  saveTopics,
  saveSettings,
  mergeArticles,
} from '../utils/storage';
import { fetchRSS as fetchRSSUtil } from '../utils/rssParser';

interface AppState {
  // Data
  sources: RSSSource[];
  articles: Article[];
  topics: Topic[];
  settings: AppSettings;

  // UI State
  isLoading: boolean;
  currentView: 'sources' | 'topics' | 'articles' | 'analysis' | 'settings';
  selectedSourceId: string | null;
  selectedTopicId: string | null;

  // Actions - Sources
  addSource: (source: Omit<RSSSource, 'id'>) => void;
  updateSource: (id: string, updates: Partial<RSSSource>) => void;
  deleteSource: (id: string) => void;
  fetchSourceArticles: (sourceId: string) => Promise<FetchResult>;
  fetchAllSources: () => Promise<FetchResult[]>;

  // Actions - Articles
  addArticles: (articles: Article[]) => void;
  markArticleAsRead: (id: string) => void;
  deleteArticlesBySource: (sourceId: string) => void;

  // Actions - Topics
  addTopic: (topic: Omit<Topic, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTopic: (id: string, updates: Partial<Topic>) => void;
  deleteTopic: (id: string) => void;

  // Actions - UI
  setCurrentView: (view: AppState['currentView']) => void;
  setSelectedSource: (id: string | null) => void;
  setSelectedTopic: (id: string | null) => void;

  // Actions - Settings
  updateSettings: (settings: Partial<AppSettings>) => void;

  // Initialize
  initialize: () => void;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export const useStore = create<AppState>((set, get) => ({
  // Initial state
  sources: [],
  articles: [],
  topics: [],
  settings: {
    theme: 'light',
    autoRefreshInterval: 0,
    articlesPerPage: 20,
    defaultTimeRange: 7,
  },
  isLoading: false,
  currentView: 'articles',
  selectedSourceId: null,
  selectedTopicId: null,

  // Initialize
  initialize: () => {
    const sources = loadSources();
    const articles = loadArticles();
    const topics = loadTopics();
    const settings = loadSettings();

    set({ sources, articles, topics, settings });
  },

  // Source actions
  addSource: (sourceData) => {
    const newSource: RSSSource = {
      ...sourceData,
      id: generateId(),
      lastUpdate: undefined,
      status: 'active',
    };

    const sources = [...get().sources, newSource];
    set({ sources });
    saveSources(sources);
  },

  updateSource: (id, updates) => {
    const sources = get().sources.map((source) =>
      source.id === id ? { ...source, ...updates } : source
    );
    set({ sources });
    saveSources(sources);
  },

  deleteSource: (id) => {
    const sources = get().sources.filter((source) => source.id !== id);
    set({ sources });
    saveSources(sources);

    // Also delete articles from this source
    get().deleteArticlesBySource(id);

    // Update topics that use this source
    const topics = get().topics.map((topic) => ({
      ...topic,
      sourceIds: topic.sourceIds.filter((sourceId) => sourceId !== id),
    }));
    set({ topics });
    saveTopics(topics);
  },

  fetchSourceArticles: async (sourceId) => {
    const source = get().sources.find((s) => s.id === sourceId);
    if (!source) {
      return {
        success: false,
        sourceId,
        articlesCount: 0,
        error: 'Source not found',
      };
    }

    set({ isLoading: true });

    const existingArticles = get().articles;
    const result = await fetchRSSUtil(source, existingArticles);

    if (result.success) {
      // Merge with existing articles
      const mergedArticles = mergeArticles(existingArticles, result.articles);

      set({ articles: mergedArticles, isLoading: false });
      saveArticles(mergedArticles);

      // Update source status
      get().updateSource(sourceId, {
        lastUpdate: new Date().toISOString(),
        status: 'active',
        errorMessage: undefined,
      });
    } else {
      set({ isLoading: false });

      get().updateSource(sourceId, {
        status: 'error',
        errorMessage: result.error,
      });
    }

    return {
      success: result.success,
      sourceId: result.sourceId,
      articlesCount: result.articlesCount,
      error: result.error,
    };
  },

  fetchAllSources: async () => {
    const sources = get().sources;
    const results: FetchResult[] = [];

    set({ isLoading: true });

    // Fetch with concurrency limit
    const CONCURRENCY_LIMIT = 3;
    for (let i = 0; i < sources.length; i += CONCURRENCY_LIMIT) {
      const batch = sources.slice(i, i + CONCURRENCY_LIMIT);
      const batchResults = await Promise.all(
        batch.map((source) => get().fetchSourceArticles(source.id))
      );
      results.push(...batchResults);
    }

    set({ isLoading: false });
    return results;
  },

  // Article actions
  addArticles: (newArticles) => {
    const existingArticles = get().articles;
    const mergedArticles = mergeArticles(existingArticles, newArticles);
    set({ articles: mergedArticles });
    saveArticles(mergedArticles);
  },

  markArticleAsRead: (id) => {
    const articles = get().articles.map((article) =>
      article.id === id ? { ...article, isRead: true } : article
    );
    set({ articles });
    saveArticles(articles);
  },

  deleteArticlesBySource: (sourceId) => {
    const articles = get().articles.filter(
      (article) => article.sourceId !== sourceId
    );
    set({ articles });
    saveArticles(articles);
  },

  // Topic actions
  addTopic: (topicData) => {
    const newTopic: Topic = {
      ...topicData,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const topics = [...get().topics, newTopic];
    set({ topics });
    saveTopics(topics);
  },

  updateTopic: (id, updates) => {
    const topics = get().topics.map((topic) =>
      topic.id === id
        ? { ...topic, ...updates, updatedAt: new Date().toISOString() }
        : topic
    );
    set({ topics });
    saveTopics(topics);
  },

  deleteTopic: (id) => {
    const topics = get().topics.filter((topic) => topic.id !== id);
    set({ topics });
    saveTopics(topics);
  },

  // UI actions
  setCurrentView: (view) => set({ currentView: view }),
  setSelectedSource: (id) => set({ selectedSourceId: id }),
  setSelectedTopic: (id) => set({ selectedTopicId: id }),

  // Settings actions
  updateSettings: (updates) => {
    const settings = { ...get().settings, ...updates };
    set({ settings });
    saveSettings(settings);
  },
}));
