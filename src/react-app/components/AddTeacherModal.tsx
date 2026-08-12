import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Phone, Briefcase, BookOpen, Loader2, CheckCircle, Copy, Check, Eye, EyeOff } from 'lucide-react';
import { api } from '../hooks/useApi';

interface CreatedTeacher {
  username: string;
  password: string;
  teacher_code: string;
  user_id: string;
  center: string;
}

interface AddTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  centerId?: string;
}

export default function AddTeacherModal({ isOpen, onClose, onSuccess, centerId }: AddTeacherModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone_number: '',
    employee_id: '',
    subjects: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdTeacher, setCreatedTeacher] = useState<CreatedTeacher | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload: any = {
        name: formData.name,
        email: formData.email || undefined,
        phone_number: formData.phone_number || undefined,
        employee_id: formData.employee_id || undefined,
        subjects: formData.subjects || undefined,
      };

      if (centerId) {
        payload.center_id = centerId;
      }

      const response = await api.post('/timetable/admin/teachers/create/', payload);
      setCreatedTeacher(response.data);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create teacher');
    } finally {
      setLoading(false);
    }
  };

  const copyCredentials = () => {
    if (createdTeacher) {
      navigator.clipboard.writeText(`Username: ${createdTeacher.username}\nPassword: ${createdTeacher.password}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', phone_number: '', employee_id: '', subjects: '' });
    setCreatedTeacher(null);
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                <User className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-gray-100">Add Teacher</h2>
                <p className="text-xs text-slate-500 dark:text-gray-400">Create a new teacher account</p>
              </div>
            </div>
            <button onClick={handleClose} className="p-2 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5">
            {!createdTeacher ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter teacher name"
                      className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 dark:border-gray-600 rounded-lg bg-slate-50 dark:bg-gray-900 text-slate-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="teacher@example.com"
                      className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 dark:border-gray-600 rounded-lg bg-slate-50 dark:bg-gray-900 text-slate-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleChange}
                      placeholder="9876543210"
                      className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 dark:border-gray-600 rounded-lg bg-slate-50 dark:bg-gray-900 text-slate-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Employee ID */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Employee ID</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      name="employee_id"
                      value={formData.employee_id}
                      onChange={handleChange}
                      placeholder="EMP-001"
                      className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 dark:border-gray-600 rounded-lg bg-slate-50 dark:bg-gray-900 text-slate-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Subjects */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Subjects</label>
                  <div className="relative">
                    <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      name="subjects"
                      value={formData.subjects}
                      onChange={handleChange}
                      placeholder="Physics, Chemistry"
                      className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 dark:border-gray-600 rounded-lg bg-slate-50 dark:bg-gray-900 text-slate-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-gray-400 bg-slate-100 dark:bg-gray-700 rounded-lg hover:bg-slate-200 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Teacher'
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                {/* Success Message */}
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-gray-100">Teacher Created!</h3>
                  <p className="text-sm text-slate-500 dark:text-gray-400">Save these credentials securely</p>
                </div>

                {/* Credentials */}
                <div className="bg-slate-50 dark:bg-gray-900 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-gray-400">Username</span>
                    <span className="text-sm font-mono font-medium text-slate-900 dark:text-gray-100">{createdTeacher.username}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-gray-400">Password</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-medium text-slate-900 dark:text-gray-100">
                        {showPassword ? createdTeacher.password : '••••••••••'}
                      </span>
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-gray-700 rounded"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-gray-400">Teacher Code</span>
                    <span className="text-sm font-mono font-medium text-slate-900 dark:text-gray-100">{createdTeacher.teacher_code}</span>
                  </div>
                </div>

                {/* Copy Button */}
                <button
                  onClick={copyCredentials}
                  className="w-full px-4 py-2.5 text-sm font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 flex items-center justify-center gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Credentials
                    </>
                  )}
                </button>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={resetForm}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-gray-400 bg-slate-100 dark:bg-gray-700 rounded-lg hover:bg-slate-200 dark:hover:bg-gray-600"
                  >
                    Add Another
                  </button>
                  <button
                    onClick={handleClose}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
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
