import { useStore } from '../store/useStore';
import { RefreshCw, Rss, FileText, BarChart3, Folder, Settings } from 'lucide-react';

export default function Navbar() {
  const { currentView, setCurrentView, fetchAllSources, isLoading, sources } =
    useStore();

  const handleRefresh = async () => {
    if (sources.length === 0) {
      alert('请先添加RSS源');
      return;
    }

    const results = await fetchAllSources();
    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    alert(
      `刷新完成！\n成功: ${successCount}\n失败: ${failCount}`
    );
  };

  const navItems = [
    { id: 'articles' as const, label: '文章列表', icon: FileText },
    { id: 'sources' as const, label: 'RSS源管理', icon: Rss },
    { id: 'topics' as const, label: '专题管理', icon: Folder },
    { id: 'analysis' as const, label: '分析报告', icon: BarChart3 },
    { id: 'settings' as const, label: '设置', icon: Settings },
  ];

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <h1 className="text-xl font-bold text-gray-900">
              RSS阅读器 & 分析系统
            </h1>

            <div className="flex space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id)}
                    className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      currentView === item.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {isLoading && (
              <span className="text-sm text-gray-600 flex items-center">
                <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                后台更新中...
              </span>
            )}
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
              />
              {isLoading ? '采集中' : '刷新'}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
