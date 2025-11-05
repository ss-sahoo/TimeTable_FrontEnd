import React, { useState } from 'react';
import { api } from '@/react-app/hooks/useApi';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  questionBankId?: number;
}

interface ImportResult {
  success: boolean;
  created_count: number;
  error_count: number;
  errors: string[];
  created_questions: any[];
}

export default function BulkImportModal({ isOpen, onClose, onSuccess, questionBankId }: BulkImportModalProps) {
  const [importType, setImportType] = useState<'csv' | 'excel' | 'json'>('csv');
  const [file, setFile] = useState<File | null>(null);
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setResult(null);
    
    // Auto-detect file type
    if (selectedFile.name.endsWith('.csv')) {
      setImportType('csv');
    } else if (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
      setImportType('excel');
    } else if (selectedFile.name.endsWith('.json')) {
      setImportType('json');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!file) return;

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (questionBankId) formData.append('question_bank_id', questionBankId.toString());
      if (subject) formData.append('subject', subject);
      if (topic) formData.append('topic', topic);

      let endpoint = '';
      if (importType === 'csv') {
        endpoint = '/questions/bulk-import-csv/';
      } else if (importType === 'excel') {
        endpoint = '/questions/bulk-import-excel/';
      } else {
        // JSON import
        const text = await file.text();
        const questionsData = JSON.parse(text);
        const response = await api.post('/questions/bulk-import/', {
          questions_data: questionsData,
          question_bank_id: questionBankId,
          subject: subject,
          topic: topic
        });
        setResult(response.data);
        setLoading(false);
        return;
      }

      const response = await api.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setResult(response.data);
      
      if (response.data.success) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Import error:', error);
      setResult({
        success: false,
        created_count: 0,
        error_count: 1,
        errors: [error.response?.data?.error || 'Import failed'],
        created_questions: []
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await api.get('/questions/download-template/', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'question_import_template.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Template download error:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Bulk Import Questions</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            {/* Import Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Import Type
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setImportType('csv')}
                  className={`p-3 border rounded-lg text-center ${
                    importType === 'csv'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="text-2xl mb-1">📄</div>
                  <div className="text-sm font-medium">CSV</div>
                </button>
                <button
                  onClick={() => setImportType('excel')}
                  className={`p-3 border rounded-lg text-center ${
                    importType === 'excel'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="text-2xl mb-1">📊</div>
                  <div className="text-sm font-medium">Excel</div>
                </button>
                <button
                  onClick={() => setImportType('json')}
                  className={`p-3 border rounded-lg text-center ${
                    importType === 'json'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="text-2xl mb-1">📋</div>
                  <div className="text-sm font-medium">JSON</div>
                </button>
              </div>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload File
              </label>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {file ? (
                  <div className="space-y-2">
                    <div className="text-green-600 text-4xl">✓</div>
                    <div className="text-sm font-medium text-gray-900">{file.name}</div>
                    <div className="text-xs text-gray-500">
                      {(file.size / 1024).toFixed(1)} KB
                    </div>
                    <button
                      onClick={() => setFile(null)}
                      className="text-red-600 text-sm hover:text-red-800"
                    >
                      Remove file
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-4xl text-gray-400">📁</div>
                    <div className="text-sm text-gray-600">
                      Drag and drop your file here, or{' '}
                      <label className="text-blue-600 hover:text-blue-800 cursor-pointer">
                        browse
                        <input
                          type="file"
                          className="hidden"
                          accept={importType === 'csv' ? '.csv' : importType === 'excel' ? '.xlsx,.xls' : '.json'}
                          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                        />
                      </label>
                    </div>
                    <div className="text-xs text-gray-500">
                      Supported: {importType === 'csv' ? 'CSV files' : importType === 'excel' ? 'Excel files (.xlsx, .xls)' : 'JSON files'}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Optional Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject (Optional)
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Mathematics"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Topic (Optional)
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Algebra"
                />
              </div>
            </div>

            {/* Template Download */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">Need a template?</div>
                  <div className="text-xs text-gray-600">
                    Download our CSV template to see the required format
                  </div>
                </div>
                <button
                  onClick={downloadTemplate}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                >
                  Download Template
                </button>
              </div>
            </div>

            {/* Import Results */}
            {result && (
              <div className={`p-4 rounded-lg ${
                result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center mb-2">
                  <div className={`text-lg mr-2 ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                    {result.success ? '✓' : '✗'}
                  </div>
                  <div className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                    Import {result.success ? 'Successful' : 'Failed'}
                  </div>
                </div>
                <div className="text-sm text-gray-700">
                  <div>Created: {result.created_count} questions</div>
                  {result.error_count > 0 && (
                    <div>Errors: {result.error_count} questions</div>
                  )}
                </div>
                {result.errors.length > 0 && (
                  <div className="mt-2">
                    <div className="text-sm font-medium text-red-800 mb-1">Errors:</div>
                    <ul className="text-xs text-red-700 space-y-1">
                      {result.errors.slice(0, 5).map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                      {result.errors.length > 5 && (
                        <li>• ... and {result.errors.length - 5} more errors</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!file || loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Importing...' : 'Import Questions'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
