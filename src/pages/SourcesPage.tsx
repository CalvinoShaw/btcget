import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Plus, Trash2, RefreshCw, AlertCircle, CheckCircle, Rss } from 'lucide-react';
import { format } from 'date-fns';

export default function SourcesPage() {
  const { sources, addSource, deleteSource, fetchSourceArticles } = useStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSource, setNewSource] = useState({ name: '', url: '' });
  const [fetchingId, setFetchingId] = useState<string | null>(null);

  const handleAddSource = () => {
    if (!newSource.name || !newSource.url) {
      alert('请填写源名称和URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(newSource.url);
    } catch {
      alert('请输入有效的URL');
      return;
    }

    addSource(newSource);
    setNewSource({ name: '', url: '' });
    setShowAddForm(false);
  };

  const handleFetchSource = async (sourceId: string) => {
    setFetchingId(sourceId);
    const result = await fetchSourceArticles(sourceId);
    setFetchingId(null);

    if (result.success) {
      alert(`成功采集 ${result.articlesCount} 篇文章`);
    } else {
      alert(`采集失败: ${result.error}`);
    }
  };

  const handleDeleteSource = (id: string, name: string) => {
    if (confirm(`确定要删除 "${name}" 吗？相关文章也将被删除。`)) {
      deleteSource(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">RSS源管理</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          添加新源
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">添加RSS源</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                源名称
              </label>
              <input
                type="text"
                value={newSource.name}
                onChange={(e) =>
                  setNewSource({ ...newSource, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例如: 链捕手"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                RSS URL
              </label>
              <input
                type="url"
                value={newSource.url}
                onChange={(e) =>
                  setNewSource({ ...newSource, url: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/rss"
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleAddSource}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                保存
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewSource({ name: '', url: '' });
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sources.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            <Rss className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>暂无RSS源，点击"添加新源"开始</p>
          </div>
        ) : (
          sources.map((source) => (
            <div
              key={source.id}
              className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-900">
                    {source.name}
                  </h3>
                  <p className="text-sm text-gray-500 break-all mt-1">
                    {source.url}
                  </p>
                </div>
                {source.status === 'active' ? (
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                )}
              </div>

              {source.lastUpdate && (
                <p className="text-xs text-gray-500 mb-3">
                  最后更新:{' '}
                  {format(new Date(source.lastUpdate), 'yyyy-MM-dd HH:mm')}
                </p>
              )}

              {source.errorMessage && (
                <p className="text-xs text-red-600 mb-3">
                  错误: {source.errorMessage}
                </p>
              )}

              <div className="flex space-x-2">
                <button
                  onClick={() => handleFetchSource(source.id)}
                  disabled={fetchingId === source.id}
                  className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 disabled:bg-gray-100 disabled:text-gray-400"
                >
                  <RefreshCw
                    className={`w-4 h-4 mr-2 ${
                      fetchingId === source.id ? 'animate-spin' : ''
                    }`}
                  />
                  {fetchingId === source.id ? '采集中' : '采集'}
                </button>
                <button
                  onClick={() => handleDeleteSource(source.id, source.name)}
                  className="px-3 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
