import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { filterArticlesByTopic, filterArticlesByDateRange } from '../utils/filter';
import { aggregateDataByDate, calculateStatistics } from '../utils/dataExtraction';
import ReactECharts from 'echarts-for-react';
import { BarChart3, Download } from 'lucide-react';
import { subDays, format } from 'date-fns';

export default function AnalysisPage() {
  const { topics, articles } = useStore();
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [dateRange, setDateRange] = useState<number>(7); // days
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [useCustomRange, setUseCustomRange] = useState(false);

  const chartData = useMemo(() => {
    if (!selectedTopicId) return null;

    const topic = topics.find((t) => t.id === selectedTopicId);
    if (!topic) return null;

    // Filter articles by topic
    const topicArticles = filterArticlesByTopic(articles, topic);

    // Determine date range
    let startDate: Date;
    let endDate: Date = new Date();

    if (useCustomRange && customStartDate && customEndDate) {
      startDate = new Date(customStartDate);
      endDate = new Date(customEndDate);
    } else {
      startDate = subDays(endDate, dateRange - 1);
    }

    // Filter by date range
    const dateFilteredArticles = filterArticlesByDateRange(
      topicArticles,
      startDate,
      endDate
    );

    // Aggregate data
    const analysisData = aggregateDataByDate(
      dateFilteredArticles,
      startDate,
      endDate
    );

    return analysisData;
  }, [
    selectedTopicId,
    topics,
    articles,
    dateRange,
    customStartDate,
    customEndDate,
    useCustomRange,
  ]);

  const statistics = useMemo(() => {
    if (!chartData) return null;

    const stats: Record<string, any> = {};

    chartData.datasets.forEach((dataset) => {
      stats[dataset.label] = calculateStatistics(dataset.data);
    });

    return stats;
  }, [chartData]);

  const chartOption = useMemo(() => {
    if (!chartData) return null;

    return {
      title: {
        text: '数据趋势分析',
        left: 'center',
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
        },
      },
      legend: {
        data: chartData.datasets.map((d) => d.label),
        top: 30,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: chartData.dates,
        axisLabel: {
          rotate: 45,
        },
      },
      yAxis: {
        type: 'value',
        name: '金额 (美元)',
        axisLabel: {
          formatter: (value: number) => {
            if (value >= 100000000) {
              return `${(value / 100000000).toFixed(1)}亿`;
            } else if (value >= 10000) {
              return `${(value / 10000).toFixed(1)}万`;
            }
            return value.toString();
          },
        },
      },
      series: chartData.datasets.map((dataset) => ({
        name: dataset.label,
        type: 'line',
        smooth: true,
        data: dataset.data,
        itemStyle: {
          color: dataset.color,
        },
        lineStyle: {
          width: 2,
        },
        emphasis: {
          focus: 'series',
        },
      })),
      toolbox: {
        feature: {
          saveAsImage: {
            title: '保存为图片',
          },
          dataZoom: {
            title: {
              zoom: '区域缩放',
              back: '还原',
            },
          },
          restore: {
            title: '还原',
          },
        },
      },
    };
  }, [chartData]);

  const handleExportCSV = () => {
    if (!chartData) return;

    let csv = 'Date,' + chartData.datasets.map((d) => d.label).join(',') + '\n';

    chartData.dates.forEach((date, index) => {
      csv += date;
      chartData.datasets.forEach((dataset) => {
        csv += ',' + dataset.data[index];
      });
      csv += '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">可视化分析报告</h2>
        {chartData && (
          <button
            onClick={handleExportCSV}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            <Download className="w-4 h-4 mr-2" />
            导出CSV
          </button>
        )}
      </div>

      {/* Settings Panel */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">分析设置</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Topic Selection */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择专题
            </label>
            <select
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">请选择专题</option>
              {topics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Type */}
          <div className="md:col-span-2">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={useCustomRange}
                onChange={(e) => setUseCustomRange(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">
                使用自定义日期范围
              </span>
            </label>
          </div>

          {!useCustomRange ? (
            /* Preset Date Range */
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                时间范围
              </label>
              <div className="flex space-x-2">
                {[7, 14, 30, 90].map((days) => (
                  <button
                    key={days}
                    onClick={() => setDateRange(days)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      dateRange === days
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    最近{days}天
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Custom Date Range */
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  开始日期
                </label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  结束日期
                </label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Chart */}
      {!selectedTopicId ? (
        <div className="bg-white p-12 rounded-lg shadow-sm border text-center text-gray-500">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">请选择一个专题开始分析</p>
        </div>
      ) : chartData && chartData.datasets.length > 0 ? (
        <>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <ReactECharts
              option={chartOption}
              style={{ height: '500px' }}
              notMerge={true}
              lazyUpdate={true}
            />
          </div>

          {/* Statistics */}
          {statistics && (
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-4">统计汇总</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(statistics).map(([label, stats]: [string, any]) => (
                  <div
                    key={label}
                    className="p-4 bg-gray-50 rounded-lg border"
                  >
                    <h4 className="font-medium text-gray-900 mb-3">{label}</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">总计:</span>
                        <span className="font-medium">
                          {stats.total >= 100000000
                            ? `${(stats.total / 100000000).toFixed(2)}亿`
                            : stats.total >= 10000
                            ? `${(stats.total / 10000).toFixed(2)}万`
                            : stats.total.toFixed(0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">平均:</span>
                        <span className="font-medium">
                          {stats.average >= 100000000
                            ? `${(stats.average / 100000000).toFixed(2)}亿`
                            : stats.average >= 10000
                            ? `${(stats.average / 10000).toFixed(2)}万`
                            : stats.average.toFixed(0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">最大:</span>
                        <span className="font-medium">
                          {stats.max >= 100000000
                            ? `${(stats.max / 100000000).toFixed(2)}亿`
                            : stats.max >= 10000
                            ? `${(stats.max / 10000).toFixed(2)}万`
                            : stats.max.toFixed(0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">数据点:</span>
                        <span className="font-medium">{stats.count}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white p-12 rounded-lg shadow-sm border text-center text-gray-500">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">该专题暂无数据</p>
          <p className="text-sm mt-2">
            请确保已采集文章且文章包含可提取的数据
          </p>
        </div>
      )}
    </div>
  );
}
