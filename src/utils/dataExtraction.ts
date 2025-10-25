import type { Article, AnalysisData } from '../types';
import { format, differenceInDays } from 'date-fns';

export interface ExtractedData {
  date: string;
  amount?: number;
  type?: string; // e.g., "多单", "空单", "总体"
  coin?: string; // e.g., "BTC", "ETH"
  rawText?: string;
}

// Extract liquidation data from article
export function extractLiquidationData(article: Article): ExtractedData[] {
  const results: ExtractedData[] = [];
  const text = `${article.title} ${article.content || article.contentSnippet || ''}`;

  // Extract amounts (e.g., "100万美元", "1.5亿美元")
  const amountRegex = /(\d+\.?\d*)\s*(万美元|亿美元|美元|万|亿)/gi;
  const amountMatches = text.matchAll(amountRegex);

  // Extract types (多单, 空单, 总体)
  const typeRegex = /(多单|空单|总体|多头|空头)/gi;
  const typeMatches = Array.from(text.matchAll(typeRegex));

  // Extract coins
  const coinRegex = /(比特币|以太坊|BTC|ETH|SOL|索拉纳|狗狗币|DOGE)/gi;
  const coinMatches = Array.from(text.matchAll(coinRegex));

  const amounts: number[] = [];
  for (const match of amountMatches) {
    const value = parseFloat(match[1]);
    const unit = match[2];

    let multiplier = 1;
    if (unit.includes('万')) {
      multiplier = 10000;
    } else if (unit.includes('亿')) {
      multiplier = 100000000;
    }

    amounts.push(value * multiplier);
  }

  const date = format(new Date(article.pubDate), 'yyyy-MM-dd');

  // If we found data, create records
  if (amounts.length > 0) {
    amounts.forEach((amount, index) => {
      results.push({
        date,
        amount,
        type: typeMatches[index]?.[1] || '未分类',
        coin: coinMatches[index]?.[1] || '未知',
        rawText: text.substring(0, 200),
      });
    });
  }

  return results;
}

// Aggregate data by date
export function aggregateDataByDate(
  articles: Article[],
  startDate: Date,
  endDate: Date
): AnalysisData {
  const extractedData: ExtractedData[] = [];

  // Extract data from all articles
  articles.forEach((article) => {
    const data = extractLiquidationData(article);
    extractedData.push(...data);
  });

  // Create date range
  const days = differenceInDays(endDate, startDate) + 1;
  const dates: string[] = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    dates.push(format(date, 'yyyy-MM-dd'));
  }

  // Group by type
  const typeMap = new Map<string, Map<string, number>>();

  extractedData.forEach((item) => {
    if (!item.amount || !item.type) return;

    if (!typeMap.has(item.type)) {
      typeMap.set(item.type, new Map());
    }

    const dateMap = typeMap.get(item.type)!;
    const currentAmount = dateMap.get(item.date) || 0;
    dateMap.set(item.date, currentAmount + item.amount);
  });

  // Convert to chart format
  const datasets = Array.from(typeMap.entries()).map(([type, dateMap]) => {
    const data = dates.map((date) => dateMap.get(date) || 0);

    // Assign colors based on type
    let color = '#3b82f6';
    if (type.includes('多') || type.includes('多头')) {
      color = '#22c55e'; // green
    } else if (type.includes('空') || type.includes('空头')) {
      color = '#ef4444'; // red
    } else if (type.includes('总体')) {
      color = '#8b5cf6'; // purple
    }

    return {
      label: type,
      data,
      color,
    };
  });

  return {
    dates,
    datasets,
  };
}

// Extract general numeric data with custom patterns
export function extractCustomData(
  article: Article,
  pattern: string
): ExtractedData[] {
  const results: ExtractedData[] = [];
  const text = `${article.title} ${article.content || article.contentSnippet || ''}`;

  try {
    const regex = new RegExp(pattern, 'gi');
    const matches = text.matchAll(regex);

    for (const match of matches) {
      results.push({
        date: format(new Date(article.pubDate), 'yyyy-MM-dd'),
        rawText: match[0],
      });
    }
  } catch (error) {
    console.error('Invalid regex pattern:', error);
  }

  return results;
}

// Calculate statistics
export function calculateStatistics(data: number[]): {
  total: number;
  average: number;
  max: number;
  min: number;
  count: number;
} {
  if (data.length === 0) {
    return { total: 0, average: 0, max: 0, min: 0, count: 0 };
  }

  const total = data.reduce((sum, val) => sum + val, 0);
  const average = total / data.length;
  const max = Math.max(...data);
  const min = Math.min(...data);

  return {
    total,
    average,
    max,
    min,
    count: data.length,
  };
}
