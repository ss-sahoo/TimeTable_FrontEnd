import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { api } from '@/react-app/hooks/useApi';
import ChartContainer from '@/react-app/components/analytics/ChartContainer';
import ExportButton from '@/react-app/components/analytics/ExportButton';

interface GraphsData {
  exam: {
    id: number;
    title: string;
  };
  score_trend: Array<{
    date: string;
    score: number;
    percentage: number;
    time_spent: number;
  }>;
  submission_distribution: Record<number, number>;
  section_performance: Array<{
    section_name: string;
    subject: string;
    average_score: number;
    average_percentage: number;
    total_attempts: number;
  }>;
  time_score_data: Array<{
    time_spent: number;
    score: number;
    percentage: number;
  }>;
  filters_applied: any;
}

export default function GraphsPage() {
  const { examId, queryParams } = useOutletContext<{
    examId: string;
    queryParams: string;
  }>();
  const [data, setData] = useState<GraphsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeGraph, setActiveGraph] = useState<'trend' | 'distribution' | 'section' | 'scatter'>('trend');

  useEffect(() => {
    loadGraphsData();
  }, [examId, queryParams]);

  const loadGraphsData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/exams/exams/${examId}/analytics/graphs/?${queryParams}`);
      setData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load graphs data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf' | 'image') => {
    console.log('Export as', format);
  };

  const trendData = data?.score_trend.map((item) => ({
    date: new Date(item.date).toLocaleDateString(),
    score: item.score,
    percentage: item.percentage,
  })) || [];

  const distributionData = data?.submission_distribution
    ? Object.entries(data.submission_distribution)
        .map(([hour, count]) => ({
          hour: `${hour}:00`,
          count,
        }))
        .sort((a, b) => Number(a.hour.split(':')[0]) - Number(b.hour.split(':')[0]))
    : [];

  const sectionData = data?.section_performance || [];

  const scatterData = data?.time_score_data.map((item) => ({
    time: item.time_spent / 60, // Convert to minutes
    score: item.score,
  })) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Performance Graphs</h2>
          <p className="text-sm text-slate-500 mt-1">
            Time-series and trend visualizations
          </p>
        </div>
        <ExportButton onExport={handleExport} />
      </div>

      {/* Graph Selector */}
      <div className="bg-white border border-slate-200 rounded-lg p-2">
        <div className="flex items-center gap-2">
          {[
            { id: 'trend', label: 'Score Trend' },
            { id: 'distribution', label: 'Submission Distribution' },
            { id: 'section', label: 'Section Performance' },
            { id: 'scatter', label: 'Time vs Score' },
          ].map((graph) => (
            <button
              key={graph.id}
              onClick={() => setActiveGraph(graph.id as any)}
              className={`px-4 py-2 text-xs font-medium rounded-md transition-colors ${
                activeGraph === graph.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {graph.label}
            </button>
          ))}
        </div>
      </div>

      <ChartContainer loading={loading} error={error} height={500}>
        {data && (
          <div className="space-y-6">
            {activeGraph === 'trend' && (
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Score Trend Over Time</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="score" stroke="#3b82f6" name="Score" />
                    <Line type="monotone" dataKey="percentage" stroke="#10b981" name="Percentage" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {activeGraph === 'distribution' && (
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Submission Time Distribution</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={distributionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {activeGraph === 'section' && (
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Performance by Section</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={sectionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="section_name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="average_score" fill="#3b82f6" name="Average Score" />
                    <Bar dataKey="average_percentage" fill="#10b981" name="Average %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {activeGraph === 'scatter' && (
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Time vs Score Scatter Plot</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" dataKey="time" name="Time (minutes)" />
                    <YAxis type="number" dataKey="score" name="Score" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter dataKey="score" data={scatterData} fill="#3b82f6" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
      </ChartContainer>
    </div>
  );
}

