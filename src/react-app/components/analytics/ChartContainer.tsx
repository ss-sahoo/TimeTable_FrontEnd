import React from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

interface ChartContainerProps {
  loading: boolean;
  error: string | null;
  children: React.ReactNode;
  height?: number;
  emptyMessage?: string;
}

export default function ChartContainer({
  loading,
  error,
  children,
  height = 400,
  emptyMessage = 'No data available',
}: ChartContainerProps) {
  if (loading) {
    return (
      <div
        className="flex items-center justify-center bg-white border border-slate-200 rounded-lg"
        style={{ height }}
      >
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
          <p className="text-sm text-slate-600">Loading chart data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex items-center justify-center bg-white border border-slate-200 rounded-lg"
        style={{ height }}
      >
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
          <p className="text-sm text-rose-600 mb-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-xs text-blue-600 hover:text-blue-700 underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-white border border-slate-200 rounded-lg p-4"
      style={{ minHeight: height }}
    >
      {children || (
        <div className="flex items-center justify-center h-full">
          <p className="text-sm text-slate-500">{emptyMessage}</p>
        </div>
      )}
    </div>
  );
}

