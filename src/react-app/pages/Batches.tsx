import { useState, useEffect } from 'react';
import {
  GraduationCap,
  Search,
  Plus,
  Calendar,
  Users,
  X,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { api } from '../hooks/useApi';

interface Batch {
  id: string;
  code: string;
  name: string;
  program: string | null;
  program_id: string | null;
  center: string | null;
  center_id: string | null;
  start_date: string | null;
  end_date: string | null;
  students_count: number;
  teachers_count: number;
  created_at: string;
  updated_at: string;
}

interface Program {
  id: string;
  name: string;
  center: string;
  center_id: string;
}

export default function Batches() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Create batch modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    program_id: '',
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    fetchBatches();
    fetchPrograms();
  }, []);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/timetable/batches/');
      setBatches(response.data.batches || []);
    } catch (err: any) {
      console.error('Failed to fetch batches:', err);
      setError(err.response?.data?.detail || 'Failed to load batches');
    } finally {
      setLoading(false);
    }
  };

  const fetchPrograms = async () => {
    try {
      const response = await api.get('/timetable/programs/');
      setPrograms(response.data.programs || []);
    } catch (err) {
      console.error('Failed to fetch programs:', err);
    }
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.code.trim()) {
      setCreateError('Batch code is required');
      return;
    }

    try {
      setCreating(true);
      setCreateError(null);
      
      const payload: any = {
        code: formData.code.trim(),
        name: formData.name.trim() || undefined,
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
      };
      
      if (formData.program_id) {
        payload.program_id = formData.program_id;
      }

      await api.post('/timetable/admin/batches/create/', payload);
      
      // Reset form and close modal
      setFormData({ code: '', name: '', program_id: '', start_date: '', end_date: '' });
      setShowCreateModal(false);
      
      // Refresh batches list
      fetchBatches();
    } catch (err: any) {
      console.error('Failed to create batch:', err);
      setCreateError(err.response?.data?.detail || 'Failed to create batch');
    } finally {
      setCreating(false);
    }
  };

  const filteredBatches = batches.filter(
    (batch) =>
      batch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      batch.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (batch.program && batch.program.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-600">Loading batches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-gray-100">Batches</h1>
          <p className="text-sm text-slate-600 dark:text-gray-400 mt-1">Manage your batches and student groups</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchBatches}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-500/25"
          >
            <Plus className="w-4 h-4" />
            Create Batch
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">{error}</p>
            <button 
              onClick={fetchBatches}
              className="text-sm text-red-600 hover:text-red-700 mt-1"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search batches..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-slate-900 dark:text-gray-100"
        />
      </div>

      {/* Batches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBatches.map((batch) => (
          <div key={batch.id} className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-gray-100">{batch.name}</h3>
                  <p className="text-sm text-slate-500 dark:text-gray-400">{batch.program || 'No program'}</p>
                  <p className="text-xs text-slate-400 dark:text-gray-500 font-mono">{batch.code}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-gray-400 flex items-center gap-1">
                  <Users className="w-4 h-4" /> Students
                </span>
                <span className="font-medium text-slate-900 dark:text-gray-100">{batch.students_count}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-gray-400 flex items-center gap-1">
                  <Users className="w-4 h-4" /> Teachers
                </span>
                <span className="font-medium text-slate-900 dark:text-gray-100">{batch.teachers_count}</span>
              </div>
              {batch.start_date && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-gray-400 flex items-center gap-1">
                    <Calendar className="w-4 h-4" /> Start Date
                  </span>
                  <span className="font-medium text-slate-900 dark:text-gray-100">{batch.start_date}</span>
                </div>
              )}
              {batch.end_date && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-gray-400 flex items-center gap-1">
                    <Calendar className="w-4 h-4" /> End Date
                  </span>
                  <span className="font-medium text-slate-900 dark:text-gray-100">{batch.end_date}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-gray-700">
              <span className="text-xs text-slate-500 dark:text-gray-400">
                {batch.center || 'No center'}
              </span>
              <button className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">Manage →</button>
            </div>
          </div>
        ))}
      </div>

      {filteredBatches.length === 0 && !loading && !error && (
        <div className="text-center py-12">
          <GraduationCap className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-gray-100 mb-2">No batches found</h3>
          <p className="text-slate-600 dark:text-gray-400 mb-4">
            {searchQuery ? 'Try adjusting your search.' : 'Create your first batch to get started.'}
          </p>
          {!searchQuery && (
            <button 
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Batch
            </button>
          )}
        </div>
      )}

      {/* Create Batch Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-gray-100">Create New Batch</h2>
              <button 
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateError(null);
                  setFormData({ code: '', name: '', program_id: '', start_date: '', end_date: '' });
                }}
                className="p-1 hover:bg-slate-100 dark:hover:bg-gray-700 rounded"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="p-4 space-y-4">
              {createError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  {createError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                  Batch Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g., BATCH-2025-A"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-slate-900 dark:text-gray-100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                  Batch Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Super 30 - Batch A (2025)"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-slate-900 dark:text-gray-100"
                />
                <p className="text-xs text-slate-500 mt-1">Leave empty to auto-generate from code</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                  Program (Optional)
                </label>
                <select
                  value={formData.program_id}
                  onChange={(e) => setFormData({ ...formData, program_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-slate-900 dark:text-gray-100"
                >
                  <option value="">Select a program...</option>
                  {programs.map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-slate-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-slate-900 dark:text-gray-100"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateError(null);
                    setFormData({ code: '', name: '', program_id: '', start_date: '', end_date: '' });
                  }}
                  className="px-4 py-2 text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                  {creating ? 'Creating...' : 'Create Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
