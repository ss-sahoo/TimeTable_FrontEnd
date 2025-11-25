import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router';
import { api } from '@/react-app/hooks/useApi';
import ChartContainer from '@/react-app/components/analytics/ChartContainer';
import ExportButton from '@/react-app/components/analytics/ExportButton';

interface HeatMapData {
  exam: {
    id: number;
    title: string;
  };
  heatmap_data: Array<{
    section_id: number;
    section_name: string;
    subject: string;
    average_score: number;
    average_percentage: number;
    max_marks: number;
    total_questions: number;
    total_attempts: number;
    performance_level: string;
  }>;
  filters_applied: any;
}

export default function HeatMapPage() {
  const { examId, queryParams } = useOutletContext<{
    examId: string;
    queryParams: string;
  }>();
  const [data, setData] = useState<HeatMapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHeatMapData();
  }, [examId, queryParams]);

  const loadHeatMapData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/exams/exams/${examId}/analytics/heatmap/?${queryParams}`);
      setData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load heat map data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf' | 'image') => {
    console.log('Export as', format);
  };

  const getPerformanceColor = (level: string) => {
    switch (level) {
      case 'excellent':
        return 'bg-emerald-500';
      case 'good':
        return 'bg-blue-500';
      case 'average':
        return 'bg-amber-500';
      case 'poor':
        return 'bg-rose-500';
      default:
        return 'bg-slate-300';
    }
  };

  const getPerformanceTextColor = (level: string) => {
    switch (level) {
      case 'excellent':
        return 'text-emerald-700';
      case 'good':
        return 'text-blue-700';
      case 'average':
        return 'text-amber-700';
      case 'poor':
        return 'text-rose-700';
      default:
        return 'text-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Heat Map</h2>
          <p className="text-sm text-slate-500 mt-1">
            Section and subject performance visualization
          </p>
        </div>
        <ExportButton onExport={handleExport} />
      </div>

      <ChartContainer loading={loading} error={error} height={600}>
        {data && (
          <div className="space-y-4">
            {data.heatmap_data.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-500">No heat map data available</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.heatmap_data.map((item) => (
                  <div
                    key={item.section_id}
                    className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-slate-900">{item.section_name}</h3>
                        <p className="text-xs text-slate-500 mt-1">{item.subject}</p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getPerformanceColor(
                          item.performance_level
                        )} ${getPerformanceTextColor(item.performance_level)} bg-opacity-20`}
                      >
                        {item.performance_level}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Average Score</span>
                        <span className="font-semibold text-slate-900">
                          {item.average_score.toFixed(2)} / {item.max_marks}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Average Percentage</span>
                        <span className="font-semibold text-slate-900">
                          {item.average_percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Questions</span>
                        <span className="font-semibold text-slate-900">{item.total_questions}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Attempts</span>
                        <span className="font-semibold text-slate-900">{item.total_attempts}</span>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-2 ${getPerformanceColor(item.performance_level)} rounded-full`}
                          style={{ width: `${item.average_percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </ChartContainer>
    </div>
  );
}

