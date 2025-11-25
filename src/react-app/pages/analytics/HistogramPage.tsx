import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { api } from '@/react-app/hooks/useApi';
import ChartContainer from '@/react-app/components/analytics/ChartContainer';
import ExportButton from '@/react-app/components/analytics/ExportButton';

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

export default function HistogramPage() {
  const { examId, queryParams, examData } = useOutletContext<{
    examId: string;
    queryParams: string;
    examData: any;
  }>();
  const [data, setData] = useState<HistogramData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [binSize, setBinSize] = useState(10);
  const [usePercentage, setUsePercentage] = useState(false);

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
      setError(err.response?.data?.error || 'Failed to load histogram data');
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Histogram</h2>
          <p className="text-sm text-slate-500 mt-1">
            Score distribution visualization
          </p>
        </div>
        <ExportButton onExport={handleExport} />
      </div>

      {/* Controls */}
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Bin Size</label>
            <input
              type="number"
              min="5"
              max="50"
              step="5"
              value={binSize}
              onChange={(e) => setBinSize(Number(e.target.value))}
              className="w-20 px-2 py-1 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="use-percentage"
              checked={usePercentage}
              onChange={(e) => setUsePercentage(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="use-percentage" className="text-xs text-slate-700">
              Use Percentage
            </label>
          </div>
        </div>
      </div>

      <ChartContainer loading={loading} error={error} height={500}>
        {data && (
          <div className="space-y-4">
            {data.histogram_data.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-500">No histogram data available</p>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                    {data.statistics.mean > 0 && (
                      <ReferenceLine
                        x={data.histogram_data.find((d) => d.min <= data.statistics.mean && d.max >= data.statistics.mean)?.range}
                        stroke="#10b981"
                        strokeDasharray="5 5"
                        label={{ value: 'Mean', position: 'top' }}
                      />
                    )}
                    {data.statistics.median > 0 && (
                      <ReferenceLine
                        x={data.histogram_data.find((d) => d.min <= data.statistics.median && d.max >= data.statistics.median)?.range}
                        stroke="#f59e0b"
                        strokeDasharray="5 5"
                        label={{ value: 'Median', position: 'top' }}
                      />
                    )}
                  </BarChart>
                </ResponsiveContainer>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-600 mb-1">Mean</p>
                    <p className="text-lg font-bold text-slate-900">{data.statistics.mean.toFixed(2)}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-600 mb-1">Median</p>
                    <p className="text-lg font-bold text-slate-900">{data.statistics.median.toFixed(2)}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-600 mb-1">Total Data Points</p>
                    <p className="text-lg font-bold text-slate-900">{data.statistics.total_data_points}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </ChartContainer>
    </div>
  );
}

