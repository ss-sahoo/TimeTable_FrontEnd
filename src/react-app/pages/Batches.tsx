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
  Filter,
  Clock,
  CheckCircle,
  TrendingUp,
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
  const [centers, setCenters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [programFilter, setProgramFilter] = useState('all');
  
  // Create batch modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    program_id: '',
    center_id: '',
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    fetchBatches();
    fetchPrograms();
    fetchCenters();
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

  const fetchCenters = async () => {
    try {
      const response = await api.get('/timetable/centers/');
      const centersData = response.data.results || response.data.centers || response.data || [];
      setCenters(Array.isArray(centersData) ? centersData : []);
    } catch (err) {
      console.error('Failed to fetch centers:', err);
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

      if (formData.center_id) {
        payload.center_id = formData.center_id;
      }

      await api.post('/timetable/admin/batches/create/', payload);
      
      // Reset form and close modal
      setFormData({ code: '', name: '', program_id: '', center_id: '', start_date: '', end_date: '' });
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
    (batch) => {
      const matchesSearch = batch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        batch.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (batch.program && batch.program.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesProgram = programFilter === 'all' || batch.program === programFilter;
      
      return matchesSearch && matchesProgram;
    }
  );

  // Calculate stats
  const activeBatches = batches.filter(b => {
    if (!b.end_date) return true;
    return new Date(b.end_date) >= new Date();
  }).length;
  
  const totalStudents = batches.reduce((sum, b) => sum + b.students_count, 0);
  const upcomingBatches = batches.filter(b => {
    if (!b.start_date) return false;
    return new Date(b.start_date) > new Date();
  }).length;

  // Get batch status
  const getBatchStatus = (batch: Batch) => {
    if (!batch.start_date) return 'draft';
    const now = new Date();
    const start = new Date(batch.start_date);
    const end = batch.end_date ? new Date(batch.end_date) : null;
    
    if (start > now) return 'upcoming';
    if (end && end < now) return 'completed';
    return 'active';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'upcoming': return 'bg-yellow-500';
      case 'completed': return 'bg-gray-300';
      default: return 'bg-blue-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-50 text-green-700 ring-green-600/20';
      case 'upcoming':
        return 'bg-yellow-50 text-yellow-800 ring-yellow-600/20';
      case 'completed':
        return 'bg-gray-100 text-gray-600 ring-gray-500/10';
      default:
        return 'bg-blue-50 text-blue-700 ring-blue-600/20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'upcoming': return 'Enrollment Open';
      case 'completed': return 'Completed';
      default: return 'Draft';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <GraduationCap className="w-6 h-6" />;
      case 'upcoming': return <Clock className="w-6 h-6" />;
      case 'completed': return <CheckCircle className="w-6 h-6" />;
      default: return <GraduationCap className="w-6 h-6" />;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getDaysUntilStart = (startDate: string) => {
    const days = Math.ceil((new Date(startDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-600">Loading batches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full px-6 py-8 bg-gray-50">
      {/* Header & Actions */}
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Batch Management
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Organize classes, track syllabus progress, and manage student enrollments.
          </p>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0">
          <button
            type="button"
            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 mr-3"
          >
            <Filter className="-ml-0.5 mr-1.5 h-5 w-5 text-gray-400" />
            Filter
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            type="button"
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <Plus className="-ml-0.5 mr-1.5 h-5 w-5" />
            Create Batch
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
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

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6 border border-gray-100">
          <dt className="truncate text-sm font-medium text-gray-500">Active Batches</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{activeBatches}</dd>
        </div>
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6 border border-gray-100">
          <dt className="truncate text-sm font-medium text-gray-500">Total Students Enrolled</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{totalStudents.toLocaleString()}</dd>
        </div>
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6 border border-gray-100">
          <dt className="truncate text-sm font-medium text-gray-500">Avg. Syllabus Completion</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-indigo-600">68%</dd>
        </div>
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6 border border-gray-100">
          <dt className="truncate text-sm font-medium text-gray-500">Upcoming Batches</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{upcomingBatches}</dd>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full rounded-md border-0 py-2.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 shadow-sm"
            placeholder="Search batches by name, code, or program..."
          />
        </div>
        <div className="flex gap-2">
          <select
            value={programFilter}
            onChange={(e) => setProgramFilter(e.target.value)}
            className="block w-full rounded-md border-0 py-2.5 pl-3 pr-8 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6 shadow-sm"
          >
            <option value="all">All Programs</option>
            {programs.map((program) => (
              <option key={program.id} value={program.name}>{program.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Batch Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredBatches.map((batch) => {
          const status = getBatchStatus(batch);
          const statusColor = getStatusColor(status);
          const statusBadge = getStatusBadge(status);
          const statusLabel = getStatusLabel(status);
          const statusIcon = getStatusIcon(status);
          const maxCapacity = 50; // Default capacity
          
          return (
            <div key={batch.id} className="group relative flex flex-col overflow-hidden rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              {/* Status Strip */}
              <div className={`absolute top-0 h-1 w-full ${statusColor}`}></div>
              
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusBadge}`}>
                        {statusLabel}
                      </span>
                      <span className="text-xs text-gray-400">{batch.code}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                      {batch.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">{batch.program || 'No Program'}</p>
                  </div>
                  <div className={`h-10 w-10 flex-shrink-0 rounded-full ${status === 'active' ? 'bg-indigo-50 text-indigo-600' : status === 'upcoming' ? 'bg-yellow-50 text-yellow-600' : 'bg-gray-100 text-gray-500'} flex items-center justify-center`}>
                    {statusIcon}
                  </div>
                </div>

                {/* Details */}
                <div className="mt-6 grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500">Students</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {batch.students_count} <span className="text-xs font-normal text-gray-400">/ {maxCapacity}</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">
                      {status === 'upcoming' ? 'Starts In' : 'Start Date'}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {status === 'upcoming' && batch.start_date
                        ? `${getDaysUntilStart(batch.start_date)} Days`
                        : formatDate(batch.start_date)}
                    </p>
                  </div>
                </div>

                {/* Progress */}
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium text-gray-500">
                      {status === 'completed' ? 'Syllabus Completion' : status === 'upcoming' ? 'Setup Status' : 'Syllabus Completion'}
                    </span>
                    <span className={`text-xs font-bold ${status === 'completed' ? 'text-green-600' : status === 'upcoming' ? 'text-gray-600' : 'text-indigo-600'}`}>
                      {status === 'completed' ? '100%' : status === 'upcoming' ? 'Ready' : '35%'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div 
                      className={`${status === 'completed' ? 'bg-green-600' : status === 'upcoming' ? 'bg-gray-300' : 'bg-indigo-600'} h-1.5 rounded-full`}
                      style={{ width: status === 'completed' ? '100%' : status === 'upcoming' ? '100%' : '35%' }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  {batch.teachers_count > 0 ? (
                    <>
                      <Users className="w-4 h-4" />
                      <span>{batch.teachers_count} Teachers</span>
                    </>
                  ) : (
                    <span className="italic">No teachers assigned</span>
                  )}
                </div>
                <a href="#" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                  {status === 'upcoming' ? 'Setup Now' : status === 'completed' ? 'View Report' : 'Manage Batch'} →
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredBatches.length === 0 && !loading && !error && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No batches found</h3>
          <p className="text-gray-600 mb-6">
            {searchQuery ? 'Try adjusting your search or filters.' : 'Get started by creating your first batch.'}
          </p>
          {!searchQuery && (
            <button 
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Create Batch
            </button>
          )}
        </div>
      )}

      {/* Create Batch Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 backdrop-blur-sm transition-opacity" onClick={() => setShowCreateModal(false)}></div>
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div className="relative transform overflow-hidden rounded-xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
                {/* Modal Header */}
                <div className="bg-indigo-600 px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold leading-6 text-white" id="modal-title">
                      Create New Batch
                    </h3>
                    <button
                      type="button"
                      className="text-indigo-200 hover:text-white"
                      onClick={() => {
                        setShowCreateModal(false);
                        setCreateError(null);
                        setFormData({ code: '', name: '', program_id: '', center_id: '', start_date: '', end_date: '' });
                      }}
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                  <p className="mt-1 text-sm text-indigo-100">
                    Configure the basic details for the new batch. You can assign students later.
                  </p>
                </div>

                {/* Modal Body */}
                <form onSubmit={handleCreateBatch}>
                  <div className="px-4 py-6 sm:p-8">
                    {createError && (
                      <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                        {createError}
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
                      {/* Batch Name (Full Width) */}
                      <div className="sm:col-span-2">
                        <label htmlFor="batch-name" className="block text-sm font-medium leading-6 text-gray-900">
                          Batch Name
                        </label>
                        <div className="mt-1">
                          <input
                            type="text"
                            name="batch-name"
                            id="batch-name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            placeholder="e.g. Super 30 - Batch A (2025)"
                          />
                        </div>
                      </div>

                      {/* Batch Code & Center */}
                      <div>
                        <label htmlFor="batch-code" className="block text-sm font-medium leading-6 text-gray-900">
                          Batch Code <span className="text-red-500">*</span>
                        </label>
                        <div className="mt-1">
                          <input
                            type="text"
                            name="batch-code"
                            id="batch-code"
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            placeholder="e.g. BATCH-2025-A"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="center" className="block text-sm font-medium leading-6 text-gray-900">
                          Center <span className="text-red-500">*</span>
                        </label>
                        <div className="mt-1">
                          <select
                            id="center"
                            name="center"
                            value={formData.center_id}
                            onChange={(e) => setFormData({ ...formData, center_id: e.target.value })}
                            className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            required
                          >
                            <option value="">Select a center...</option>
                            {centers.map((center) => (
                              <option key={center.id} value={center.id}>
                                {center.name} - {center.city}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Program */}
                      <div className="sm:col-span-2">
                        <label htmlFor="program" className="block text-sm font-medium leading-6 text-gray-900">
                          Program <span className="text-xs text-gray-500">(Optional)</span>
                        </label>
                        <div className="mt-1">
                          <select
                            id="program"
                            name="program"
                            value={formData.program_id}
                            onChange={(e) => setFormData({ ...formData, program_id: e.target.value })}
                            className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                          >
                            <option value="">Select a program...</option>
                            {programs.map((program) => (
                              <option key={program.id} value={program.id}>
                                {program.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Dates */}
                      <div>
                        <label htmlFor="start-date" className="block text-sm font-medium leading-6 text-gray-900">
                          Start Date
                        </label>
                        <div className="mt-1">
                          <input
                            type="date"
                            name="start-date"
                            id="start-date"
                            value={formData.start_date}
                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                            className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="end-date" className="block text-sm font-medium leading-6 text-gray-900">
                          End Date
                        </label>
                        <div className="mt-1">
                          <input
                            type="date"
                            name="end-date"
                            id="end-date"
                            value={formData.end_date}
                            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                            className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 border-t border-gray-200">
                    <button
                      type="submit"
                      disabled={creating}
                      className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {creating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Batch'
                      )}
                    </button>
                    <button
                      type="button"
                      className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                      onClick={() => {
                        setShowCreateModal(false);
                        setCreateError(null);
                        setFormData({ code: '', name: '', program_id: '', center_id: '', start_date: '', end_date: '' });
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
