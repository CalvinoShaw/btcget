import type { Article, FilterRule, Topic } from '../types';

export function matchesFilter(article: Article, filter: FilterRule): boolean {
  const { keywords, mode, searchIn, caseSensitive, excludeMode } = filter;

  // Determine what text to search
  let textToSearch = '';
  switch (searchIn) {
    case 'title':
      textToSearch = article.title;
      break;
    case 'content':
      textToSearch = article.content || article.contentSnippet || '';
      break;
    case 'both':
    default:
      textToSearch = `${article.title} ${article.content || article.contentSnippet || ''}`;
      break;
  }

  // Normalize text if not case sensitive
  if (!caseSensitive) {
    textToSearch = textToSearch.toLowerCase();
  }

  // Check keyword matches
  const keywordMatches = keywords.map((keyword) => {
    const searchKeyword = caseSensitive ? keyword : keyword.toLowerCase();
    return textToSearch.includes(searchKeyword);
  });

  // Apply mode logic
  let result: boolean;
  if (mode === 'AND') {
    result = keywordMatches.every((match) => match);
  } else {
    // OR mode
    result = keywordMatches.some((match) => match);
  }

  // Apply exclude mode (NOT logic)
  if (excludeMode) {
    result = !result;
  }

  return result;
}

export function matchesTopic(article: Article, topic: Topic): boolean {
  // Check if article is from one of the topic's sources
  if (!topic.sourceIds.includes(article.sourceId)) {
    return false;
  }

  // If no filters, include all articles from the sources
  if (topic.filters.length === 0) {
    return true;
  }

  // Article must match ALL filters (AND logic between filters)
  return topic.filters.every((filter) => matchesFilter(article, filter));
}

export function filterArticlesByTopic(
  articles: Article[],
  topic: Topic
): Article[] {
  return articles.filter((article) => matchesTopic(article, topic));
}

export function filterArticlesBySource(
  articles: Article[],
  sourceId: string
): Article[] {
  return articles.filter((article) => article.sourceId === sourceId);
}

export function filterArticlesByDateRange(
  articles: Article[],
  startDate: Date,
  endDate: Date
): Article[] {
  return articles.filter((article) => {
    const articleDate = new Date(article.pubDate);
    return articleDate >= startDate && articleDate <= endDate;
  });
}

export function sortArticlesByDate(
  articles: Article[],
  order: 'asc' | 'desc' = 'desc'
): Article[] {
  return [...articles].sort((a, b) => {
    const dateA = new Date(a.pubDate).getTime();
    const dateB = new Date(b.pubDate).getTime();
    return order === 'desc' ? dateB - dateA : dateA - dateB;
  });
}
