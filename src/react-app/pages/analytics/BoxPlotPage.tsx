import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '@/react-app/hooks/useApi';
import ChartContainer from '@/react-app/components/analytics/ChartContainer';
import ExportButton from '@/react-app/components/analytics/ExportButton';

interface BoxPlotData {
  exam: {
    id: number;
    title: string;
  };
  boxplot_data: Array<{
    section_id?: number;
    section_name?: string;
    subject?: string;
    scores: number[];
    quartiles: {
      min: number;
      q1: number;
      median: number;
      q3: number;
      max: number;
    };
    outliers: number[];
    iqr: number;
    lower_bound: number;
    upper_bound: number;
  }> | {
    scores: number[];
    quartiles: {
      min: number;
      q1: number;
      median: number;
      q3: number;
      max: number;
    };
    outliers: number[];
    iqr: number;
    lower_bound: number;
    upper_bound: number;
  };
  filters_applied: any;
}

export default function BoxPlotPage() {
  const { examId, queryParams } = useOutletContext<{
    examId: string;
    queryParams: string;
  }>();
  const [data, setData] = useState<BoxPlotData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBoxPlotData();
  }, [examId, queryParams]);

  const loadBoxPlotData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/exams/exams/${examId}/analytics/boxplot/?${queryParams}`);
      setData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load box plot data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf' | 'image') => {
    console.log('Export as', format);
  };

  const isArray = Array.isArray(data?.boxplot_data);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Box Plot</h2>
          <p className="text-sm text-slate-500 mt-1">
            Score distribution quartiles and outliers
          </p>
        </div>
        <ExportButton onExport={handleExport} />
      </div>

      <ChartContainer loading={loading} error={error} height={600}>
        {data && (
          <div className="space-y-6">
            {isArray ? (
              // Multiple box plots for sections
              <div className="space-y-6">
                {(data.boxplot_data as any[]).map((item, index) => (
                  <div key={item.section_id || index} className="bg-slate-50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-slate-900 mb-4">
                      {item.section_name} ({item.subject})
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-slate-600 mb-1">Min</p>
                        <p className="text-lg font-bold text-slate-900">{item.quartiles.min.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 mb-1">Q1 (25%)</p>
                        <p className="text-lg font-bold text-slate-900">{item.quartiles.q1.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 mb-1">Median</p>
                        <p className="text-lg font-bold text-blue-600">{item.quartiles.median.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 mb-1">Q3 (75%)</p>
                        <p className="text-lg font-bold text-slate-900">{item.quartiles.q3.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 mb-1">Max</p>
                        <p className="text-lg font-bold text-slate-900">{item.quartiles.max.toFixed(2)}</p>
                      </div>
                    </div>
                    {item.outliers.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs text-slate-600 mb-2">
                          Outliers ({item.outliers.length}): {item.outliers.slice(0, 5).map(o => o.toFixed(2)).join(', ')}
                          {item.outliers.length > 5 && '...'}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              // Single box plot
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Min</p>
                    <p className="text-lg font-bold text-slate-900">
                      {(data.boxplot_data as any).quartiles.min.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Q1 (25%)</p>
                    <p className="text-lg font-bold text-slate-900">
                      {(data.boxplot_data as any).quartiles.q1.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Median</p>
                    <p className="text-lg font-bold text-blue-600">
                      {(data.boxplot_data as any).quartiles.median.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Q3 (75%)</p>
                    <p className="text-lg font-bold text-slate-900">
                      {(data.boxplot_data as any).quartiles.q3.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Max</p>
                    <p className="text-lg font-bold text-slate-900">
                      {(data.boxplot_data as any).quartiles.max.toFixed(2)}
                    </p>
                  </div>
                </div>
                {(data.boxplot_data as any).outliers.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-amber-900 mb-2">
                      Outliers ({(data.boxplot_data as any).outliers.length})
                    </p>
                    <p className="text-xs text-amber-700">
                      {(data.boxplot_data as any).outliers.slice(0, 10).map((o: number) => o.toFixed(2)).join(', ')}
                      {(data.boxplot_data as any).outliers.length > 10 && '...'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </ChartContainer>
    </div>
  );
}

