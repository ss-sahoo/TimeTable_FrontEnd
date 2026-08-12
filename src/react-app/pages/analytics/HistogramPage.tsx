import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { BarChart3, Settings2, TrendingUp, Hash, Activity } from 'lucide-react';
import { api, getErrorMessage } from '@/react-app/hooks/useApi';
import GlassCard from '@/react-app/components/analytics/GlassCard';
import ModernChartContainer from '@/react-app/components/analytics/ModernChartContainer';
import PageHeader from '@/react-app/components/analytics/PageHeader';
import ModernExportButton from '@/react-app/components/analytics/ModernExportButton';
import StatCard from '@/react-app/components/analytics/StatCard';

interface HistogramData {
  exam: {
    id: number;
    title: string;
  };
  histogram_data: Array<{
    range: string;
    min: number;
    max: number;
    count: number;
    percentage: number;
  }>;
  statistics: {
    mean: number;
    median: number;
    total_data_points: number;
  };
  filters_applied: any;
  bin_size: number;
  use_percentage: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-xl border border-slate-200 rounded-xl p-4 shadow-xl">
        <p className="text-sm font-semibold text-slate-900 mb-2">{label}</p>
        <div className="space-y-1">
          <p className="text-xs text-slate-600">
            Count: <span className="font-semibold text-blue-600">{payload[0].value}</span>
          </p>
          {payload[0].payload.percentage && (
            <p className="text-xs text-slate-600">
              Percentage: <span className="font-semibold text-purple-600">{payload[0].payload.percentage.toFixed(1)}%</span>
            </p>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export default function HistogramPage() {
  const { examId, queryParams } = useOutletContext<{
    examId: string;
    queryParams: string;
    examData: any;
  }>();
  const [data, setData] = useState<HistogramData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [binSize, setBinSize] = useState(10);
  const [usePercentage, setUsePercentage] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    loadHistogramData();
  }, [examId, queryParams, binSize, usePercentage]);

  const loadHistogramData = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams(queryParams);
      params.append('bin_size', binSize.toString());
      params.append('use_percentage', usePercentage.toString());
      const response = await api.get(`/exams/exams/${examId}/analytics/histogram/?${params.toString()}`);
      setData(response.data);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to load histogram data'));
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf' | 'image') => {
    console.log('Export as', format);
  };

  const chartData = data?.histogram_data.map((item) => ({
    range: item.range,
    count: item.count,
    percentage: item.percentage,
  })) || [];

  // Generate gradient colors for bars
  const getBarColor = (index: number, total: number) => {
    const hue = 220 + (index / total) * 60; // Blue to purple gradient
    return `hsl(${hue}, 70%, 55%)`;
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Histogram"
        subtitle="Score distribution visualization"
        icon={BarChart3}
        actions={
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSettings(!showSettings)}
              className={`
                p-2.5 rounded-xl transition-all
                ${showSettings 
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }
              `}
            >
              <Settings2 className="w-4 h-4" />
            </motion.button>
            <ModernExportButton onExport={handleExport} />
          </div>
        }
      />

      {/* Settings Panel */}
      {showSettings && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <GlassCard padding="sm">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-slate-700">Bin Size</label>
                <div className="flex items-center gap-1">
                  {[5, 10, 15, 20].map((size) => (
                    <button
                      key={size}
                      onClick={() => setBinSize(size)}
                      className={`
                        px-3 py-1.5 text-xs font-medium rounded-lg transition-all
                        ${binSize === size 
                          ? 'bg-blue-500 text-white shadow-md' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }
                      `}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-slate-700">Use Percentage</label>
                <button
                  onClick={() => setUsePercentage(!usePercentage)}
                  className={`
                    relative w-12 h-6 rounded-full transition-colors
                    ${usePercentage ? 'bg-blue-500' : 'bg-slate-200'}
                  `}
                >
                  <motion.div
                    animate={{ x: usePercentage ? 24 : 2 }}
                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-md"
                  />
                </button>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Stats Summary */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Mean Score"
            value={data.statistics.mean.toFixed(2)}
            icon={TrendingUp}
            variant="info"
          />
          <StatCard
            title="Median Score"
            value={data.statistics.median.toFixed(2)}
            icon={Activity}
            variant="success"
          />
          <StatCard
            title="Total Students"
            value={data.statistics.total_data_points}
            icon={Hash}
            variant="default"
          />
        </div>
      )}

      <ModernChartContainer loading={loading} error={error} height={500} onRetry={loadHistogramData}>
        {data && (
          <div className="space-y-6">
            {data.histogram_data.length === 0 ? (
              <div className="text-center py-16">
                <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No histogram data available</p>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={chartData} barCategoryGap="15%">
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.8} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis 
                      dataKey="range" 
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      axisLine={{ stroke: '#e2e8f0' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      axisLine={{ stroke: '#e2e8f0' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="count" 
                      radius={[8, 8, 0, 0]}
                    >
                      {chartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={getBarColor(index, chartData.length)}
                        />
                      ))}
                    </Bar>
                    {data.statistics.mean > 0 && (
                      <ReferenceLine
                        x={data.histogram_data.find((d) => d.min <= data.statistics.mean && d.max >= data.statistics.mean)?.range}
                        stroke="#10b981"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        label={{ 
                          value: 'Mean', 
                          position: 'top',
                          fill: '#10b981',
                          fontSize: 12,
                          fontWeight: 600
                        }}
                      />
                    )}
                    {data.statistics.median > 0 && (
                      <ReferenceLine
                        x={data.histogram_data.find((d) => d.min <= data.statistics.median && d.max >= data.statistics.median)?.range}
                        stroke="#f59e0b"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        label={{ 
                          value: 'Median', 
                          position: 'top',
                          fill: '#f59e0b',
                          fontSize: 12,
                          fontWeight: 600
                        }}
                      />
                    )}
                  </BarChart>
                </ResponsiveContainer>

                {/* Distribution Breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3">
                  {chartData.map((item, index) => (
                    <motion.div
                      key={item.range}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-slate-50 rounded-xl p-3 text-center hover:bg-slate-100 transition-colors"
                    >
                      <p className="text-xs text-slate-500 mb-1">{item.range}</p>
                      <p className="text-lg font-bold text-slate-900">{item.count}</p>
                      <p className="text-xs text-slate-400">{item.percentage?.toFixed(1)}%</p>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </ModernChartContainer>
    </div>
  );
}
