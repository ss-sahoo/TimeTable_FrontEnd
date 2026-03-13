import React, { useState } from 'react';
import { api } from '@/react-app/hooks/useApi';
import { Download, FileText, FileSpreadsheet, File } from 'lucide-react';
import { toast } from "react-toastify";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  examId: number;
  examTitle: string;
}

export default function ExportModal({ isOpen, onClose, examId, examTitle }: ExportModalProps) {
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    setExporting(format);
    
    try {
      const response = await api.get(`/exams/${examId}/export/${format}/`, {
        responseType: 'blob'
      });
      
      // Create blob and download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      link.download = `exam_${examId}_results_${timestamp}.${format === 'excel' ? 'xlsx' : format}`;
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Export error:', error);
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
        : undefined;
      toast.error(`Export failed: ${errorMessage || 'Unknown error'}`);
    } finally {
      setExporting(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Export Exam Results</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Exporting results for:</p>
            <p className="font-medium text-gray-900">{examTitle}</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => handleExport('csv')}
              disabled={exporting !== null}
              className="w-full p-4 border border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-green-600" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">CSV Format</div>
                  <div className="text-sm text-gray-600">Comma-separated values</div>
                </div>
              </div>
              {exporting === 'csv' && (
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              )}
            </button>

            <button
              onClick={() => handleExport('excel')}
              disabled={exporting !== null}
              className="w-full p-4 border border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-5 h-5 text-green-600" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">Excel Format</div>
                  <div className="text-sm text-gray-600">Microsoft Excel (.xlsx)</div>
                </div>
              </div>
              {exporting === 'excel' && (
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              )}
            </button>

            <button
              onClick={() => handleExport('pdf')}
              disabled={exporting !== null}
              className="w-full p-4 border border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <File className="w-5 h-5 text-red-600" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">PDF Format</div>
                  <div className="text-sm text-gray-600">Portable Document Format</div>
                </div>
              </div>
              {exporting === 'pdf' && (
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              )}
            </button>
          </div>

          <div className="mt-6 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-2">
              <Download className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <div className="font-medium mb-1">Export includes:</div>
                <ul className="text-xs space-y-1 text-blue-700">
                  <li>• Student information and scores</li>
                  <li>• Attempt details and timing</li>
                  <li>• Summary statistics</li>
                  <li>• Formatted for easy analysis</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
