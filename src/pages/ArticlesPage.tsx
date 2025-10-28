import { useState, useMemo, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { filterArticlesByTopic, sortArticlesByDate } from '../utils/filter';
import { FileText, ExternalLink, Calendar, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const ARTICLES_PER_PAGE = 50;

export default function ArticlesPage() {
  const { articles, topics, sources, markArticleAsRead } = useStore();
  const [selectedTopicId, setSelectedTopicId] = useState<string>('all');
  const [selectedSourceId, setSelectedSourceId] = useState<string>('all');
  const [showReadOnly, setShowReadOnly] = useState(false);
  const [displayCount, setDisplayCount] = useState(ARTICLES_PER_PAGE);
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

  const handleReadArticle = (articleId: string, link: string) => {
    markArticleAsRead(articleId);
    window.open(link, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">文章列表</h2>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            显示 {displayedArticles.length} / {filteredArticles.length} 篇
          </span>
        </div>
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

      {/* Articles List */}
      <div className="space-y-4">
        {filteredArticles.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-white rounded-lg border">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>暂无文章</p>
            <p className="text-sm mt-2">
              请先在"RSS源管理"中采集文章，或调整过滤条件
            </p>
          </div>
        ) : (
          <>
            {displayedArticles.map((article) => (
              <div
                key={article.id}
                className={`bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow ${
                  article.isRead ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900 mb-2">
                      {article.title}
                    </h3>

                    {article.contentSnippet && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                        {article.contentSnippet}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatDistanceToNow(new Date(article.pubDate), {
                          addSuffix: true,
                          locale: zhCN,
                        })}
                      </span>

                      <span className="px-2 py-1 bg-gray-100 rounded">
                        {getSourceName(article.sourceId)}
                      </span>

                      {article.isRead && (
                        <span className="flex items-center text-blue-600">
                          <Eye className="w-3 h-3 mr-1" />
                          已读
                        </span>
                      )}

                      {article.categories && article.categories.length > 0 && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                          {article.categories[0]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleReadArticle(article.id, article.link)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    阅读原文
                  </button>
                </div>
              </div>
            ))}

            {/* Load more trigger */}
            {hasMore && (
              <div
                ref={loadMoreRef}
                className="text-center py-8 text-gray-500"
              >
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2">加载更多...</p>
              </div>
            )}

            {!hasMore && displayedArticles.length > 0 && (
              <div className="text-center py-8 text-gray-400">
                <p>已显示全部文章</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
