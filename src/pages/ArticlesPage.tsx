import { useState, useMemo, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { filterArticlesByTopic, sortArticlesByDate } from '../utils/filter';
import { FileText, ExternalLink, Calendar, Eye, X } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { Article } from '../types';

const ARTICLES_PER_PAGE = 50;

export default function ArticlesPage() {
  const { articles, topics, sources, markArticleAsRead } = useStore();
  const [selectedTopicId, setSelectedTopicId] = useState<string>('all');
  const [selectedSourceId, setSelectedSourceId] = useState<string>('all');
  const [showReadOnly, setShowReadOnly] = useState(false);
  const [displayCount, setDisplayCount] = useState(ARTICLES_PER_PAGE);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const filteredArticles = useMemo(() => {
    let filtered = [...articles];

    // Filter by topic
    if (selectedTopicId !== 'all') {
      const topic = topics.find((t) => t.id === selectedTopicId);
      if (topic) {
        filtered = filterArticlesByTopic(filtered, topic);
      }
    }

    // Filter by source
    if (selectedSourceId !== 'all') {
      filtered = filtered.filter((a) => a.sourceId === selectedSourceId);
    }

    // Filter by read status
    if (showReadOnly) {
      filtered = filtered.filter((a) => a.isRead);
    }

    return sortArticlesByDate(filtered, 'desc');
  }, [articles, selectedTopicId, selectedSourceId, showReadOnly, topics]);

  // Reset display count when filters change
  useEffect(() => {
    setDisplayCount(ARTICLES_PER_PAGE);
    setSelectedArticle(null);
  }, [selectedTopicId, selectedSourceId, showReadOnly]);

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && displayCount < filteredArticles.length) {
          setDisplayCount((prev) => Math.min(prev + ARTICLES_PER_PAGE, filteredArticles.length));
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [displayCount, filteredArticles.length]);

  const displayedArticles = filteredArticles.slice(0, displayCount);
  const hasMore = displayCount < filteredArticles.length;

  const getSourceName = (sourceId: string) => {
    const source = sources.find((s) => s.id === sourceId);
    return source?.name || '未知来源';
  };

  const handleSelectArticle = (article: Article) => {
    setSelectedArticle(article);
    markArticleAsRead(article.id);
  };

  const handleOpenOriginal = (link: string) => {
    window.open(link, '_blank');
  };

  return (
    <div className="h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">文章列表</h2>
          <span className="text-sm text-gray-600">
            显示 {displayedArticles.length} / {filteredArticles.length} 篇
          </span>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                按专题过滤
              </label>
              <select
                value={selectedTopicId}
                onChange={(e) => setSelectedTopicId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">全部</option>
                {topics.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                按来源过滤
              </label>
              <select
                value={selectedSourceId}
                onChange={(e) => setSelectedSourceId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">全部</option>
                {sources.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showReadOnly}
                  onChange={(e) => setShowReadOnly(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">仅显示已读</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Sidebar Layout */}
      <div className="flex gap-4 h-[calc(100%-12rem)] overflow-hidden">
        {/* Left: Articles List */}
        <div className="w-full lg:w-2/5 bg-white rounded-lg shadow-sm border overflow-y-auto">
          {filteredArticles.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>暂无文章</p>
              <p className="text-sm mt-2">
                请先在"RSS源管理"中采集文章，或调整过滤条件
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {displayedArticles.map((article) => (
                <div
                  key={article.id}
                  onClick={() => handleSelectArticle(article)}
                  className={`p-4 cursor-pointer transition-colors ${
                    selectedArticle?.id === article.id
                      ? 'bg-blue-50 border-l-4 border-l-blue-600'
                      : 'hover:bg-gray-50'
                  } ${article.isRead ? 'opacity-60' : ''}`}
                >
                  <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
                    {article.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <span className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDistanceToNow(new Date(article.pubDate), {
                        addSuffix: true,
                        locale: zhCN,
                      })}
                    </span>

                    <span className="px-2 py-0.5 bg-gray-100 rounded">
                      {getSourceName(article.sourceId)}
                    </span>

                    {article.isRead && (
                      <span className="flex items-center text-blue-600">
                        <Eye className="w-3 h-3 mr-1" />
                        已读
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {/* Load more trigger */}
              {hasMore && (
                <div ref={loadMoreRef} className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              )}

              {!hasMore && displayedArticles.length > 0 && (
                <div className="text-center py-4 text-gray-400 text-sm">
                  已显示全部文章
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Article Detail */}
        <div className="hidden lg:block flex-1 bg-white rounded-lg shadow-sm border overflow-hidden">
          {selectedArticle ? (
            <div className="h-full flex flex-col">
              {/* Detail Header */}
              <div className="p-6 border-b">
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 flex-1 pr-4">
                    {selectedArticle.title}
                  </h2>
                  <button
                    onClick={() => setSelectedArticle(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-4">
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {format(new Date(selectedArticle.pubDate), 'yyyy-MM-dd HH:mm')}
                  </span>

                  <span className="px-2 py-1 bg-gray-100 rounded">
                    {getSourceName(selectedArticle.sourceId)}
                  </span>

                  {selectedArticle.creator && (
                    <span>作者: {selectedArticle.creator}</span>
                  )}
                </div>

                <button
                  onClick={() => handleOpenOriginal(selectedArticle.link)}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  查看原文
                </button>
              </div>

              {/* Detail Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: selectedArticle.content || selectedArticle.contentSnippet || '暂无内容',
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>选择一篇文章查看详情</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile: Full Screen Article Detail */}
      {selectedArticle && (
        <div className="lg:hidden fixed inset-0 bg-white z-50 overflow-y-auto">
          <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
            <button
              onClick={() => setSelectedArticle(null)}
              className="text-gray-600 hover:text-gray-900"
            >
              <X className="w-6 h-6" />
            </button>
            <button
              onClick={() => handleOpenOriginal(selectedArticle.link)}
              className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm"
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              原文
            </button>
          </div>

          <div className="p-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {selectedArticle.title}
            </h2>

            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 mb-6">
              <span className="flex items-center">
                <Calendar className="w-3 h-3 mr-1" />
                {format(new Date(selectedArticle.pubDate), 'yyyy-MM-dd HH:mm')}
              </span>

              <span className="px-2 py-0.5 bg-gray-100 rounded">
                {getSourceName(selectedArticle.sourceId)}
              </span>

              {selectedArticle.creator && (
                <span>作者: {selectedArticle.creator}</span>
              )}
            </div>

            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{
                __html: selectedArticle.content || selectedArticle.contentSnippet || '暂无内容',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
