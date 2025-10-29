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

    if (selectedTopicId !== 'all') {
      const topic = topics.find((t) => t.id === selectedTopicId);
      if (topic) {
        filtered = filterArticlesByTopic(filtered, topic);
      }
    }

    if (selectedSourceId !== 'all') {
      filtered = filtered.filter((a) => a.sourceId === selectedSourceId);
    }

    if (showReadOnly) {
      filtered = filtered.filter((a) => a.isRead);
    }

    return sortArticlesByDate(filtered, 'desc');
  }, [articles, selectedTopicId, selectedSourceId, showReadOnly, topics]);

  useEffect(() => {
    setDisplayCount(ARTICLES_PER_PAGE);
    setSelectedArticle(null);
  }, [selectedTopicId, selectedSourceId, showReadOnly]);

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
    <div className="flex flex-col" style={{ height: 'calc(100vh - 7rem)' }}>
      {/* Header */}
      <div className="flex-shrink-0 py-4">
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
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Desktop: Left Articles List (1/4 width) */}
        <div className="hidden lg:block w-1/4 bg-white rounded-lg shadow-sm border overflow-y-auto flex-shrink-0">
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
                  } ${article.isRead ? 'opacity-70' : ''}`}
                >
                  {/* 标题 */}
                  <h3 className="font-semibold text-gray-900 mb-2 text-sm leading-tight">
                    {article.title}
                  </h3>

                  {/* 源名称 */}
                  <div className="mb-2">
                    <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                      {getSourceName(article.sourceId)}
                    </span>
                  </div>

                  {/* 更新时间 */}
                  <div className="flex items-center text-xs text-gray-500 mb-2">
                    <Calendar className="w-3 h-3 mr-1" />
                    {formatDistanceToNow(new Date(article.pubDate), {
                      addSuffix: true,
                      locale: zhCN,
                    })}
                  </div>

                  {/* 内容简介 */}
                  {article.contentSnippet && (
                    <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
                      {article.contentSnippet}
                    </p>
                  )}

                  {/* 已读标记 */}
                  {article.isRead && (
                    <div className="mt-2">
                      <span className="inline-flex items-center text-xs text-blue-600">
                        <Eye className="w-3 h-3 mr-1" />
                        已读
                      </span>
                    </div>
                  )}
                </div>
              ))}

              {/* Load more trigger */}
              {hasMore && (
                <div ref={loadMoreRef} className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              )}

              {!hasMore && displayedArticles.length > 0 && (
                <div className="text-center py-4 text-gray-400 text-xs">
                  已显示全部文章
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile: Articles List (full width) */}
        <div className="lg:hidden w-full bg-white rounded-lg shadow-sm border overflow-y-auto">
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
                    article.isRead ? 'opacity-70' : ''
                  } hover:bg-gray-50`}
                >
                  {/* 标题 */}
                  <h3 className="font-semibold text-gray-900 mb-2 text-sm leading-tight">
                    {article.title}
                  </h3>

                  {/* 源名称 */}
                  <div className="mb-2">
                    <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                      {getSourceName(article.sourceId)}
                    </span>
                  </div>

                  {/* 更新时间 */}
                  <div className="flex items-center text-xs text-gray-500 mb-2">
                    <Calendar className="w-3 h-3 mr-1" />
                    {formatDistanceToNow(new Date(article.pubDate), {
                      addSuffix: true,
                      locale: zhCN,
                    })}
                  </div>

                  {/* 内容简介 */}
                  {article.contentSnippet && (
                    <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
                      {article.contentSnippet}
                    </p>
                  )}

                  {/* 已读标记 */}
                  {article.isRead && (
                    <div className="mt-2">
                      <span className="inline-flex items-center text-xs text-blue-600">
                        <Eye className="w-3 h-3 mr-1" />
                        已读
                      </span>
                    </div>
                  )}
                </div>
              ))}

              {/* Load more trigger */}
              {hasMore && (
                <div ref={loadMoreRef} className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              )}

              {!hasMore && displayedArticles.length > 0 && (
                <div className="text-center py-4 text-gray-400 text-xs">
                  已显示全部文章
                </div>
              )}
            </div>
          )}
        </div>

        {/* Desktop: Right Article Detail (3/4 width) */}
        <div className="hidden lg:block w-3/4 bg-white rounded-lg shadow-sm border overflow-hidden flex-shrink-0">
          {selectedArticle ? (
            <div className="h-full flex flex-col">
              {/* Detail Header */}
              <div className="p-6 border-b bg-gray-50">
                <div className="flex items-start justify-between mb-4">
                  <h1 className="text-3xl font-bold text-gray-900 flex-1 pr-4 leading-tight">
                    {selectedArticle.title}
                  </h1>
                  <button
                    onClick={() => setSelectedArticle(null)}
                    className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    {format(new Date(selectedArticle.pubDate), 'yyyy年MM月dd日 HH:mm')}
                  </span>

                  <span className="px-3 py-1 bg-white border border-gray-200 rounded-full">
                    来源：{getSourceName(selectedArticle.sourceId)}
                  </span>

                  {selectedArticle.creator && (
                    <span className="px-3 py-1 bg-white border border-gray-200 rounded-full">
                      作者：{selectedArticle.creator}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleOpenOriginal(selectedArticle.link)}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  查看原文
                </button>
              </div>

              {/* Detail Content */}
              <div className="flex-1 overflow-y-auto p-8 bg-white">
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: selectedArticle.content || selectedArticle.contentSnippet || '<p class="text-gray-500">暂无内容</p>',
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <FileText className="w-20 h-20 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">选择一篇文章查看详情</p>
                <p className="text-sm mt-2">点击左侧列表中的任意文章</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile: Full Screen Article Detail */}
      {selectedArticle && (
        <div className="lg:hidden fixed inset-0 bg-white z-50 overflow-y-auto">
          <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between shadow-sm">
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

          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4 leading-tight">
              {selectedArticle.title}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 mb-6 pb-6 border-b">
              <span className="flex items-center">
                <Calendar className="w-3 h-3 mr-1" />
                {format(new Date(selectedArticle.pubDate), 'yyyy-MM-dd HH:mm')}
              </span>

              <span className="px-2 py-1 bg-gray-100 rounded">
                {getSourceName(selectedArticle.sourceId)}
              </span>

              {selectedArticle.creator && (
                <span>作者: {selectedArticle.creator}</span>
              )}
            </div>

            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{
                __html: selectedArticle.content || selectedArticle.contentSnippet || '<p class="text-gray-500">暂无内容</p>',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
