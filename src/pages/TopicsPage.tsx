import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Plus, Trash2, Edit2, Folder, X } from 'lucide-react';
import { format } from 'date-fns';
import type { FilterRule, Topic } from '../types';

export default function TopicsPage() {
  const { topics, sources, addTopic, updateTopic, deleteTopic } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    sourceIds: [] as string[],
    filters: [] as FilterRule[],
  });

  const handleOpenForm = (topic?: Topic) => {
    if (topic) {
      setEditingTopic(topic);
      setFormData({
        name: topic.name,
        sourceIds: topic.sourceIds,
        filters: topic.filters,
      });
    } else {
      setEditingTopic(null);
      setFormData({
        name: '',
        sourceIds: [],
        filters: [],
      });
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTopic(null);
    setFormData({
      name: '',
      sourceIds: [],
      filters: [],
    });
  };

  const handleAddFilter = () => {
    const newFilter: FilterRule = {
      id: `filter-${Date.now()}`,
      keywords: [],
      mode: 'AND',
      searchIn: 'both',
      caseSensitive: false,
      excludeMode: false,
    };
    setFormData({
      ...formData,
      filters: [...formData.filters, newFilter],
    });
  };

  const handleUpdateFilter = (index: number, updates: Partial<FilterRule>) => {
    const newFilters = [...formData.filters];
    newFilters[index] = { ...newFilters[index], ...updates };
    setFormData({ ...formData, filters: newFilters });
  };

  const handleRemoveFilter = (index: number) => {
    setFormData({
      ...formData,
      filters: formData.filters.filter((_, i) => i !== index),
    });
  };

  const handleSaveTopic = () => {
    if (!formData.name) {
      alert('请输入专题名称');
      return;
    }

    if (formData.sourceIds.length === 0) {
      alert('请至少选择一个RSS源');
      return;
    }

    if (editingTopic) {
      updateTopic(editingTopic.id, formData);
    } else {
      addTopic(formData);
    }

    handleCloseForm();
  };

  const handleDeleteTopic = (id: string, name: string) => {
    if (confirm(`确定要删除专题 "${name}" 吗？`)) {
      deleteTopic(id);
    }
  };

  const handleSourceToggle = (sourceId: string) => {
    if (formData.sourceIds.includes(sourceId)) {
      setFormData({
        ...formData,
        sourceIds: formData.sourceIds.filter((id) => id !== sourceId),
      });
    } else {
      setFormData({
        ...formData,
        sourceIds: [...formData.sourceIds, sourceId],
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">专题管理</h2>
        <button
          onClick={() => handleOpenForm()}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          创建专题
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">
                  {editingTopic ? '编辑专题' : '创建新专题'}
                </h3>
                <button
                  onClick={handleCloseForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Topic Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    专题名称
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="例如: 爆仓数据分析"
                  />
                </div>

                {/* Source Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    选择RSS源
                  </label>
                  {sources.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      请先在"RSS源管理"中添加源
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {sources.map((source) => (
                        <label
                          key={source.id}
                          className="flex items-center p-3 border rounded-md hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={formData.sourceIds.includes(source.id)}
                            onChange={() => handleSourceToggle(source.id)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="ml-3 text-sm">{source.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Filters */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      过滤规则
                    </label>
                    <button
                      onClick={handleAddFilter}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      + 添加规则
                    </button>
                  </div>

                  {formData.filters.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      暂无过滤规则，将显示所有文章
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {formData.filters.map((filter, index) => (
                        <div
                          key={filter.id}
                          className="p-4 border rounded-md bg-gray-50"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-gray-700">
                              规则 {index + 1}
                            </span>
                            <button
                              onClick={() => handleRemoveFilter(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">
                                关键词（逗号分隔）
                              </label>
                              <input
                                type="text"
                                value={filter.keywords.join(', ')}
                                onChange={(e) =>
                                  handleUpdateFilter(index, {
                                    keywords: e.target.value
                                      .split(',')
                                      .map((k) => k.trim())
                                      .filter((k) => k),
                                  })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="例如: 数据：, 爆仓"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">
                                  匹配模式
                                </label>
                                <select
                                  value={filter.mode}
                                  onChange={(e) =>
                                    handleUpdateFilter(index, {
                                      mode: e.target.value as 'AND' | 'OR',
                                    })
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="AND">AND (全部匹配)</option>
                                  <option value="OR">OR (任一匹配)</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-xs text-gray-600 mb-1">
                                  搜索范围
                                </label>
                                <select
                                  value={filter.searchIn}
                                  onChange={(e) =>
                                    handleUpdateFilter(index, {
                                      searchIn: e.target.value as
                                        | 'title'
                                        | 'content'
                                        | 'both',
                                    })
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="both">标题和内容</option>
                                  <option value="title">仅标题</option>
                                  <option value="content">仅内容</option>
                                </select>
                              </div>
                            </div>

                            <div className="flex space-x-4">
                              <label className="flex items-center text-sm">
                                <input
                                  type="checkbox"
                                  checked={filter.caseSensitive || false}
                                  onChange={(e) =>
                                    handleUpdateFilter(index, {
                                      caseSensitive: e.target.checked,
                                    })
                                  }
                                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <span className="ml-2 text-gray-600">
                                  区分大小写
                                </span>
                              </label>

                              <label className="flex items-center text-sm">
                                <input
                                  type="checkbox"
                                  checked={filter.excludeMode || false}
                                  onChange={(e) =>
                                    handleUpdateFilter(index, {
                                      excludeMode: e.target.checked,
                                    })
                                  }
                                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <span className="ml-2 text-gray-600">
                                  排除模式 (NOT)
                                </span>
                              </label>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex space-x-3 pt-4 border-t">
                  <button
                    onClick={handleSaveTopic}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    保存
                  </button>
                  <button
                    onClick={handleCloseForm}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Topics List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {topics.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            <Folder className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>暂无专题，点击"创建专题"开始</p>
          </div>
        ) : (
          topics.map((topic) => (
            <div
              key={topic.id}
              className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-lg text-gray-900">
                  {topic.name}
                </h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleOpenForm(topic)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTopic(topic.id, topic.name)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  <span className="font-medium">RSS源:</span>{' '}
                  {topic.sourceIds.length} 个
                </p>
                <p>
                  <span className="font-medium">过滤规则:</span>{' '}
                  {topic.filters.length} 条
                </p>
                <p>
                  <span className="font-medium">创建时间:</span>{' '}
                  {format(new Date(topic.createdAt), 'yyyy-MM-dd')}
                </p>
              </div>

              {topic.filters.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-gray-500 mb-2">关键词:</p>
                  <div className="flex flex-wrap gap-1">
                    {topic.filters.flatMap((f) =>
                      f.keywords.map((keyword, i) => (
                        <span
                          key={`${f.id}-${i}`}
                          className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
                        >
                          {keyword}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
