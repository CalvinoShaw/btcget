import { useStore } from '../store/useStore';
import { Download, Upload, Trash2 } from 'lucide-react';
import { exportData, importData, clearAllData } from '../utils/storage';

export default function SettingsPage() {
  const { sources, articles, topics } = useStore();

  const handleExport = () => {
    const data = exportData();
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rss-reader-config-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);

        if (confirm('导入配置会覆盖当前所有数据，确定要继续吗？')) {
          importData(data);
          alert('导入成功！页面将刷新以加载新数据。');
          window.location.reload();
        }
      } catch (error) {
        alert('导入失败：文件格式不正确');
        console.error(error);
      }
    };
    input.click();
  };

  const handleClearAll = () => {
    if (
      confirm(
        '确定要清空所有数据吗？这将删除所有RSS源、文章和专题。此操作不可恢复！'
      )
    ) {
      if (confirm('再次确认：真的要清空所有数据吗？')) {
        clearAllData();
        alert('数据已清空！页面将刷新。');
        window.location.reload();
      }
    }
  };

  const getStorageSize = () => {
    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length;
      }
    }
    return (total / 1024).toFixed(2);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">设置</h2>

      {/* 数据统计 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">数据统计</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">RSS源</p>
            <p className="text-2xl font-bold text-blue-600">{sources.length}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600">文章</p>
            <p className="text-2xl font-bold text-green-600">{articles.length}</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-gray-600">专题</p>
            <p className="text-2xl font-bold text-purple-600">{topics.length}</p>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg">
            <p className="text-sm text-gray-600">存储空间</p>
            <p className="text-2xl font-bold text-orange-600">
              {getStorageSize()}KB
            </p>
          </div>
        </div>
      </div>

      {/* 数据管理 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">数据管理</h3>
        <p className="text-sm text-gray-600 mb-4">
          导出配置文件可以在不同设备间共享RSS源、专题等设置。导入配置文件会覆盖当前所有数据。
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExport}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Download className="w-4 h-4 mr-2" />
            导出配置
          </button>
          <button
            onClick={handleImport}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            <Upload className="w-4 h-4 mr-2" />
            导入配置
          </button>
          <button
            onClick={handleClearAll}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            清空所有数据
          </button>
        </div>
      </div>

      {/* 使用说明 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">跨设备使用说明</h3>
        <div className="space-y-3 text-sm text-gray-600">
          <div>
            <p className="font-medium text-gray-900 mb-1">1. 在设备A上：</p>
            <p>点击"导出配置"按钮，保存配置文件到本地</p>
          </div>
          <div>
            <p className="font-medium text-gray-900 mb-1">2. 传输文件：</p>
            <p>通过邮件、云盘、聊天工具等将配置文件发送到设备B</p>
          </div>
          <div>
            <p className="font-medium text-gray-900 mb-1">3. 在设备B上：</p>
            <p>打开本应用，进入设置页面，点击"导入配置"，选择配置文件</p>
          </div>
          <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
            <p className="font-medium text-yellow-900 mb-1">⚠️ 注意：</p>
            <p className="text-yellow-800">
              导入配置会完全覆盖当前设备上的所有数据（包括RSS源、文章、专题）。建议在导入前先导出当前配置作为备份。
            </p>
          </div>
        </div>
      </div>

      {/* 关于 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">关于</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p>RSS阅读器 & 可视化分析系统</p>
          <p>版本：1.0.0</p>
          <p>
            项目地址：
            <a
              href="https://github.com/CalvinoShaw/btcget"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline ml-1"
            >
              GitHub
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
