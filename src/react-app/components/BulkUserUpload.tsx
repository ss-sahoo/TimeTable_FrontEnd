import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from "react-toastify";
import {
  Upload, X, FileSpreadsheet, CheckCircle, AlertCircle, Download,
  Loader2, Eye, EyeOff, Copy, Check, GraduationCap, Briefcase, UserCog,
} from 'lucide-react';
import { api, getErrorMessage } from '../hooks/useApi';

type UserRole = 'teacher' | 'student' | 'staff';

interface CreatedUser {
  row: number;
  name: string;
  username: string;
  password: string;
  code?: string; // teacher_code, student_code, or staff_code
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
  created_users?: CreatedUser[];
  created_teachers?: CreatedUser[];
  created_students?: CreatedUser[];
  created_staff?: CreatedUser[];
  errors: UploadError[];
  center?: string;
}

interface BulkUserUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  centerId?: string;
  defaultRole?: UserRole;
}

const roleConfig = {
  teacher: {
    label: 'Teachers',
    icon: UserCog,
    color: 'green',
    endpoint: '/timetable/superadmin/teachers/bulk_create/',
    templateFields: 'name,email,phone_number,employee_id,subjects',
    templateExample: 'John Doe,john@example.com,9876543210,EMP-001,"Physics, Chemistry"\nJane Smith,jane@example.com,9876543211,EMP-002,Mathematics',
    codeField: 'teacher_code',
    resultKey: 'created_teachers',
  },
  student: {
    label: 'Students',
    icon: GraduationCap,
    color: 'amber',
    endpoint: '/timetable/superadmin/students/bulk_create/',
    templateFields: 'name,email,phone_number,roll_number,batch_code',
    templateExample: 'Alice Johnson,alice@example.com,9876543210,ROLL-001,JEE-2026-A\nBob Wilson,bob@example.com,9876543211,ROLL-002,JEE-2026-A',
    codeField: 'student_code',
    resultKey: 'created_students',
  },
  staff: {
    label: 'Staff',
    icon: Briefcase,
    color: 'purple',
    endpoint: '/timetable/superadmin/staff/bulk_create/',
    templateFields: 'name,email,phone_number,employee_id,department',
    templateExample: 'Mike Brown,mike@example.com,9876543210,STF-001,Administration\nSarah Davis,sarah@example.com,9876543211,STF-002,Finance',
    codeField: 'staff_code',
    resultKey: 'created_staff',
  },
};

export default function BulkUserUpload({ isOpen, onClose, onSuccess, centerId, defaultRole = 'teacher' }: BulkUserUploadProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>(defaultRole);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [showPasswords, setShowPasswords] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const config = roleConfig[selectedRole];

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

      const response = await api.post(config.endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setResult(response.data);
      if (response.data.success > 0 && onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      const msg = getErrorMessage(error, 'Upload failed');
      setResult({
        message: msg,
        total: 0,
        success: 0,
        failed: 1,
        errors: [{ row: 0, error: msg, data: {} }],
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
    const csvContent = `${config.templateFields}\n${config.templateExample}`;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedRole}s_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getCreatedUsers = (): CreatedUser[] => {
    if (!result) return [];
    return result.created_users || 
           result[config.resultKey as keyof UploadResult] as CreatedUser[] || 
           [];
  };

  const downloadResults = () => {
    const createdUsers = getCreatedUsers();
    if (!createdUsers.length) return;
    
    const csvContent = [
      `Name,Username,Password,${config.codeField.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())},Email`,
      ...createdUsers.map(u => 
        `"${u.name}","${u.username}","${u.password}","${u.code || ''}","${u.email}"`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `created_${selectedRole}s.csv`;
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

  const Icon = config.icon;
  const createdUsers = getCreatedUsers();

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
              <div className={`w-10 h-10 bg-${config.color}-100 dark:bg-${config.color}-900/30 rounded-xl flex items-center justify-center`}>
                <Icon className={`w-5 h-5 text-${config.color}-600 dark:text-${config.color}-400`} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-gray-100">Bulk Upload Users</h2>
                <p className="text-xs text-slate-500 dark:text-gray-400">Upload Excel or CSV file to create multiple users</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* Role Selection Tabs */}
          <div className="px-5 pt-4">
            <div className="flex gap-2 p-1 bg-slate-100 dark:bg-gray-700 rounded-xl">
              {(Object.keys(roleConfig) as UserRole[]).map((role) => {
                const RoleIcon = roleConfig[role].icon;
                const isActive = selectedRole === role;
                return (
                  <button
                    key={role}
                    onClick={() => {
                      setSelectedRole(role);
                      resetForm();
                    }}
                    disabled={uploading}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-white dark:bg-gray-600 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                    } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <RoleIcon className="w-4 h-4" />
                    <span>{roleConfig[role].label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="p-5 overflow-y-auto max-h-[calc(90vh-200px)]">
            {!result ? (
              <div className="space-y-4">
                {/* Template Download */}
                <div className={`flex items-center justify-between p-3 bg-${config.color}-50 dark:bg-${config.color}-900/20 rounded-xl`}>
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className={`w-5 h-5 text-${config.color}-600 dark:text-${config.color}-400`} />
                    <span className="text-sm text-slate-700 dark:text-gray-300">Download template for {config.label.toLowerCase()}</span>
                  </div>
                  <button
                    onClick={downloadTemplate}
                    className={`flex items-center gap-1.5 px-3 py-1.5 bg-${config.color}-600 text-white text-xs font-medium rounded-lg hover:bg-${config.color}-700`}
                  >
                    <Download className="w-3.5 h-3.5" />
                    Template
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
                        className="text-xs text-red-600 hover:text-red-700 font-medium"
                      >
                        Remove file
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="w-12 h-12 bg-slate-100 dark:bg-gray-700 rounded-xl flex items-center justify-center mx-auto">
                        <Upload className="w-6 h-6 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-700 dark:text-gray-300">
                          Drag and drop your file here, or{' '}
                          <label className="text-blue-600 hover:text-blue-700 cursor-pointer font-medium">
                            browse
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept=".xlsx,.csv"
                              onChange={handleFileChange}
                              className="hidden"
                            />
                          </label>
                        </p>
                        <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">Supports .xlsx and .csv files</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Upload Button */}
                <button
                  onClick={handleUpload}
                  disabled={!file || uploading}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 bg-${config.color}-600 text-white font-medium rounded-xl hover:bg-${config.color}-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Uploading {config.label}...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      Upload {config.label}
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Result Summary */}
                <div className={`p-4 rounded-xl ${result.success > 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                  <div className="flex items-center gap-3">
                    {result.success > 0 ? (
                      <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                    )}
                    <div>
                      <p className={`font-medium ${result.success > 0 ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}>
                        {result.message}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-gray-400">
                        {result.success} created, {result.failed} failed out of {result.total} total
                      </p>
                    </div>
                  </div>
                </div>

                {/* Created Users */}
                {createdUsers.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-gray-100">
                        Created {config.label} ({createdUsers.length})
                      </h3>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowPasswords(!showPasswords)}
                          className="flex items-center gap-1.5 px-2 py-1 text-xs text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg"
                        >
                          {showPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          {showPasswords ? 'Hide' : 'Show'} Passwords
                        </button>
                        <button
                          onClick={downloadResults}
                          className={`flex items-center gap-1.5 px-2 py-1 text-xs text-${config.color}-600 dark:text-${config.color}-400 hover:bg-${config.color}-50 dark:hover:bg-${config.color}-900/20 rounded-lg font-medium`}
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download CSV
                        </button>
                      </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {createdUsers.map((user, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 dark:bg-gray-700/50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm text-slate-900 dark:text-gray-100">{user.name}</span>
                            {user.code && (
                              <span className={`px-2 py-0.5 bg-${config.color}-100 dark:bg-${config.color}-900/30 text-${config.color}-700 dark:text-${config.color}-400 text-xs font-mono rounded`}>
                                {user.code}
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-slate-500 dark:text-gray-400">Username: </span>
                              <span className="text-slate-700 dark:text-gray-300 font-mono">{user.username}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-slate-500 dark:text-gray-400">Password: </span>
                              <span className="text-slate-700 dark:text-gray-300 font-mono">
                                {showPasswords ? user.password : '••••••••'}
                              </span>
                              <button
                                onClick={() => copyToClipboard(user.password, `pwd-${idx}`)}
                                className="p-0.5 hover:bg-slate-200 dark:hover:bg-gray-600 rounded"
                              >
                                {copiedId === `pwd-${idx}` ? (
                                  <Check className="w-3 h-3 text-green-600" />
                                ) : (
                                  <Copy className="w-3 h-3 text-slate-400" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Errors */}
                {result.errors.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-red-800 dark:text-red-300">
                      Errors ({result.errors.length})
                    </h3>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {result.errors.map((err, idx) => (
                        <div key={idx} className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-xs">
                          <span className="text-red-700 dark:text-red-400">Row {err.row}: </span>
                          <span className="text-red-600 dark:text-red-300">{err.error}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={resetForm}
                    className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-gray-600 text-slate-700 dark:text-gray-300 font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-gray-700"
                  >
                    Upload More
                  </button>
                  <button
                    onClick={onClose}
                    className={`flex-1 px-4 py-2.5 bg-${config.color}-600 text-white font-medium rounded-xl hover:bg-${config.color}-700`}
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
