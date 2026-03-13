import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from "react-toastify";
import {
  Upload, X, FileSpreadsheet, CheckCircle, AlertCircle, Download,
  Users, Loader2, Eye, EyeOff, Copy, Check,
} from 'lucide-react';
import { api } from '../hooks/useApi';

interface CreatedTeacher {
  row: number;
  name: string;
  username: string;
  password: string;
  teacher_code: string;
  email: string;
  user_id: string;
}

interface UploadError {
  row: number;
  error: string;
  data: any;
}

interface UploadResult {
  message: string;
  total: number;
  success: number;
  failed: number;
  created_teachers: CreatedTeacher[];
  errors: UploadError[];
  center: string;
}

interface BulkTeacherUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  centerId?: string;
}

export default function BulkTeacherUpload({ isOpen, onClose, onSuccess, centerId }: BulkTeacherUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [showPasswords, setShowPasswords] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv',
      ];
      if (validTypes.includes(selectedFile.type) || 
          selectedFile.name.endsWith('.xlsx') || 
          selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setResult(null);
      } else {
        toast.error('Please upload an Excel (.xlsx) or CSV file');
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.csv'))) {
      setFile(droppedFile);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (centerId) {
        formData.append('center_id', centerId);
      }

      const response = await api.post('/timetable/admin/teachers/bulk-create/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setResult(response.data);
      if (response.data.success > 0 && onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      setResult({
        message: error.response?.data?.detail || 'Upload failed',
        total: 0,
        success: 0,
        failed: 1,
        created_teachers: [],
        errors: [{ row: 0, error: error.response?.data?.detail || 'Upload failed', data: {} }],
        center: '',
      });
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const downloadTemplate = () => {
    const csvContent = 'name,email,phone_number,employee_id,subjects\nJohn Doe,john@example.com,9876543210,EMP-001,"Physics, Chemistry"\nJane Smith,jane@example.com,9876543211,EMP-002,Mathematics';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'teachers_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadResults = () => {
    if (!result?.created_teachers.length) return;
    
    const csvContent = [
      'Name,Username,Password,Teacher Code,Email',
      ...result.created_teachers.map(t => 
        `"${t.name}","${t.username}","${t.password}","${t.teacher_code}","${t.email}"`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'created_teachers.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetForm = () => {
    setFile(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-gray-100">Bulk Upload Teachers</h2>
                <p className="text-xs text-slate-500 dark:text-gray-400">Upload Excel or CSV file to create multiple teachers</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>


          {/* Content */}
          <div className="p-5 overflow-y-auto max-h-[calc(90vh-140px)]">
            {!result ? (
              <div className="space-y-4">
                {/* Template Download */}
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm text-blue-700 dark:text-blue-300">Download template file</span>
                  </div>
                  <button
                    onClick={downloadTemplate}
                    className="px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-800"
                  >
                    <Download className="w-3.5 h-3.5 inline mr-1" />
                    Download
                  </button>
                </div>

                {/* File Upload Area */}
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                    file
                      ? 'border-green-400 bg-green-50 dark:bg-green-900/20'
                      : 'border-slate-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  
                  {file ? (
                    <div className="space-y-3">
                      <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mx-auto">
                        <FileSpreadsheet className="w-6 h-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-gray-100">{file.name}</p>
                        <p className="text-xs text-slate-500 dark:text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <button
                        onClick={resetForm}
                        className="text-xs text-red-600 hover:text-red-700"
                      >
                        Remove file
                      </button>
                    </div>
                  ) : (
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <div className="w-12 h-12 bg-slate-100 dark:bg-gray-700 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <Upload className="w-6 h-6 text-slate-400" />
                      </div>
                      <p className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                        Drop your file here or click to browse
                      </p>
                      <p className="text-xs text-slate-500 dark:text-gray-400">
                        Supports .xlsx and .csv files
                      </p>
                    </label>
                  )}
                </div>

                {/* Expected Columns */}
                <div className="p-4 bg-slate-50 dark:bg-gray-900/50 rounded-xl">
                  <p className="text-xs font-semibold text-slate-700 dark:text-gray-300 mb-2">Expected columns:</p>
                  <div className="flex flex-wrap gap-2">
                    {['name*', 'email', 'phone_number', 'employee_id', 'subjects'].map((col) => (
                      <span
                        key={col}
                        className={`px-2 py-1 text-xs rounded-lg ${
                          col.includes('*')
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-slate-200 text-slate-600 dark:bg-gray-700 dark:text-gray-400'
                        }`}
                      >
                        {col}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-gray-400 mt-2">* Required field</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Result Summary */}
                <div className={`p-4 rounded-xl ${
                  result.success > 0 && result.failed === 0
                    ? 'bg-green-50 dark:bg-green-900/20'
                    : result.success > 0
                    ? 'bg-amber-50 dark:bg-amber-900/20'
                    : 'bg-red-50 dark:bg-red-900/20'
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    {result.success > 0 && result.failed === 0 ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : result.success > 0 ? (
                      <AlertCircle className="w-6 h-6 text-amber-600" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-red-600" />
                    )}
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-gray-100">{result.message}</p>
                      <p className="text-xs text-slate-600 dark:text-gray-400">
                        {result.success} created, {result.failed} failed out of {result.total} total
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-2 bg-white dark:bg-gray-800 rounded-lg">
                      <p className="text-lg font-semibold text-slate-900 dark:text-gray-100">{result.total}</p>
                      <p className="text-xs text-slate-500">Total</p>
                    </div>
                    <div className="text-center p-2 bg-white dark:bg-gray-800 rounded-lg">
                      <p className="text-lg font-semibold text-green-600">{result.success}</p>
                      <p className="text-xs text-slate-500">Success</p>
                    </div>
                    <div className="text-center p-2 bg-white dark:bg-gray-800 rounded-lg">
                      <p className="text-lg font-semibold text-red-600">{result.failed}</p>
                      <p className="text-xs text-slate-500">Failed</p>
                    </div>
                  </div>
                </div>


                {/* Created Teachers */}
                {result.created_teachers.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-900 dark:text-gray-100">Created Teachers</p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowPasswords(!showPasswords)}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg"
                          title={showPasswords ? 'Hide passwords' : 'Show passwords'}
                        >
                          {showPasswords ? (
                            <EyeOff className="w-4 h-4 text-slate-500" />
                          ) : (
                            <Eye className="w-4 h-4 text-slate-500" />
                          )}
                        </button>
                        <button
                          onClick={downloadResults}
                          className="px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg flex items-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Export
                        </button>
                      </div>
                    </div>
                    
                    <div className="border border-slate-200 dark:border-gray-700 rounded-xl overflow-hidden">
                      <div className="max-h-60 overflow-y-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-slate-50 dark:bg-gray-900/50 sticky top-0">
                            <tr>
                              <th className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-gray-400">Name</th>
                              <th className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-gray-400">Username</th>
                              <th className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-gray-400">Password</th>
                              <th className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-gray-400">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 dark:divide-gray-700">
                            {result.created_teachers.map((teacher) => (
                              <tr key={teacher.user_id} className="hover:bg-slate-50 dark:hover:bg-gray-900/30">
                                <td className="px-3 py-2 text-slate-900 dark:text-gray-100">{teacher.name}</td>
                                <td className="px-3 py-2 font-mono text-slate-600 dark:text-gray-400">{teacher.username}</td>
                                <td className="px-3 py-2 font-mono text-slate-600 dark:text-gray-400">
                                  {showPasswords ? teacher.password : '••••••••'}
                                </td>
                                <td className="px-3 py-2">
                                  <button
                                    onClick={() => copyToClipboard(`Username: ${teacher.username}\nPassword: ${teacher.password}`, teacher.user_id)}
                                    className="p-1 hover:bg-slate-100 dark:hover:bg-gray-700 rounded"
                                    title="Copy credentials"
                                  >
                                    {copiedId === teacher.user_id ? (
                                      <Check className="w-3.5 h-3.5 text-green-600" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                                    )}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Errors */}
                {result.errors.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-red-600">Errors</p>
                    <div className="border border-red-200 dark:border-red-800 rounded-xl overflow-hidden">
                      <div className="max-h-40 overflow-y-auto">
                        {result.errors.map((error, idx) => (
                          <div key={idx} className="px-3 py-2 border-b border-red-100 dark:border-red-900 last:border-0 bg-red-50 dark:bg-red-900/20">
                            <p className="text-xs text-red-700 dark:text-red-400">
                              <span className="font-semibold">Row {error.row}:</span> {error.error}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Upload Another */}
                <button
                  onClick={resetForm}
                  className="w-full py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                >
                  Upload Another File
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          {!result && (
            <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-200 dark:border-gray-700">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload & Create
                  </>
                )}
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
