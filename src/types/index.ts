// RSS Source Types
export interface RSSSource {
  id: string;
  name: string;
  url: string;
  lastUpdate?: string;
  status?: 'active' | 'error';
  errorMessage?: string;
}

// Article Types
export interface Article {
  id: string;
  sourceId: string;
  title: string;
  content: string;
  contentSnippet?: string;
  pubDate: string;
  link: string;
  isRead?: boolean;
  creator?: string;
  categories?: string[];
}

// Filter Rule Types
export interface FilterRule {
  id: string;
  keywords: string[];
  mode: 'AND' | 'OR';
  searchIn: 'title' | 'content' | 'both';
  caseSensitive?: boolean;
  excludeMode?: boolean; // true for NOT logic
}

// Topic Types
export interface Topic {
  id: string;
  name: string;
  sourceIds: string[];
  filters: FilterRule[];
  createdAt: string;
  updatedAt: string;
}

// Visualization Data Types
export interface ChartDataPoint {
  date: string;
  value: number;
  category?: string;
}

export interface AnalysisData {
  dates: string[];
  datasets: {
    label: string;
    data: number[];
    color?: string;
  }[];
}

// Storage Types
export interface AppData {
  sources: RSSSource[];
  articles: Article[];
  topics: Topic[];
  settings?: AppSettings;
}

export interface AppSettings {
  theme?: 'light' | 'dark';
  autoRefreshInterval?: number;
  articlesPerPage?: number;
  defaultTimeRange?: number; // days
}

// API Response Types
export interface FetchResult {
  success: boolean;
  sourceId: string;
  articlesCount: number;
  error?: string;
}
