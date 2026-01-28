import { useState, useEffect, useMemo } from 'react';
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
  MapPin,
  ArrowUpRight,
  FileText,
  PlusCircle,
  Building2,
  ChevronRight,
  BookOpen,
  Layers,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../hooks/useApi';
import { useAuthContext } from '../contexts/AuthContext';

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
  category?: string;
  description?: string;
}

export default function Batches() {
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState<'batches' | 'programs'>('batches');
  const [batches, setBatches] = useState<Batch[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [centers, setCenters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [programFilter, setProgramFilter] = useState('all');
  const [centerFilter, setCenterFilter] = useState('all');

  // Create batch modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [creatingProgram, setCreatingProgram] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [programError, setProgramError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    program_id: '',
    center_id: '',
    start_date: '',
    end_date: '',
  });

  const [programData, setProgramData] = useState({
    name: '',
    description: '',
    category: '',
    center_id: '',
  });

  useEffect(() => {
    fetchBatches();
    fetchCenters();
  }, []);

  useEffect(() => {
    if (centers.length > 0) {
      fetchPrograms();
    }
  }, [centers]);

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
      const allPrograms = response.data.programs || [];

      // Filter programs to only show those belonging to the institute's centers
      if (centers.length > 0) {
        const centerIds = new Set(centers.map(c => String(c.id)));
        setPrograms(allPrograms.filter((p: any) => centerIds.has(String(p.center_id))));
      } else {
        setPrograms(allPrograms);
      }
    } catch (err) {
      console.error('Failed to fetch programs:', err);
    }
  };

  const fetchCenters = async () => {
    try {
      const response = await api.get('/timetable/centers/');
      const centersData = response.data.results || response.data.centers || response.data || [];
      const allCenters = Array.isArray(centersData) ? centersData : [];

      // Get institute ID from either top-level or nested institute object
      const userInstituteId = user?.institute_id || user?.institute?.id;

      if (userInstituteId) {
        const targetId = String(userInstituteId);
        const filtered = allCenters.filter((c: any) => {
          const centerInstituteId = c.institute_id || c.institute?.id || c.institute;
          return String(centerInstituteId) === targetId;
        });
        setCenters(filtered);
      } else {
        setCenters(allCenters);
      }
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

      setFormData({ code: '', name: '', program_id: '', center_id: '', start_date: '', end_date: '' });
      setShowCreateModal(false);
      fetchBatches();
    } catch (err: any) {
      console.error('Failed to create batch:', err);
      setCreateError(err.response?.data?.detail || 'Failed to create batch');
    } finally {
      setCreating(false);
    }
  };

  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreatingProgram(true);
      setProgramError(null);

      const payload = {
        ...programData,
        center_id: programData.center_id || centers[0]?.id
      };

      await api.post('/timetable/superadmin/programs/create/', payload);

      await fetchPrograms();
      setProgramData({ name: '', description: '', category: '', center_id: '' });
      setShowProgramModal(false);
    } catch (err: any) {
      console.error('Failed to create program:', err);
      setProgramError(err.response?.data?.detail || 'Failed to create program');
    } finally {
      setCreatingProgram(false);
    }
  };

  const filteredBatches = useMemo(() => {
    return batches.filter(
      (batch) => {
        const matchesSearch = batch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          batch.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (batch.program && batch.program.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesProgram = programFilter === 'all' || batch.program === programFilter;
        const matchesCenter = centerFilter === 'all' || String(batch.center_id) === centerFilter;

        return matchesSearch && matchesProgram && matchesCenter;
      }
    );
  }, [batches, searchQuery, programFilter, centerFilter]);

  const programsByCenter = useMemo(() => {
    return centers.map(center => {
      const centerPrograms = programs.filter(p => String(p.center_id) === String(center.id));
      const filteredCenterPrograms = centerPrograms.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

      return {
        ...center,
        programs: filteredCenterPrograms,
        totalPrograms: centerPrograms.length
      };
    }).filter(c => c.programs.length > 0 || (searchQuery === '' && c.totalPrograms > 0));
  }, [centers, programs, searchQuery]);

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
      case 'active': return 'bg-emerald-500';
      case 'upcoming': return 'bg-amber-500';
      case 'completed': return 'bg-slate-300';
      default: return 'bg-indigo-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20';
      case 'upcoming':
        return 'bg-amber-50 text-amber-800 ring-amber-600/20';
      case 'completed':
        return 'bg-slate-100 text-slate-600 ring-slate-500/10';
      default:
        return 'bg-indigo-50 text-indigo-700 ring-indigo-600/20';
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
      case 'active': return <GraduationCap className="w-5 h-5" />;
      case 'upcoming': return <Clock className="w-5 h-5" />;
      case 'completed': return <CheckCircle className="w-5 h-5" />;
      default: return <GraduationCap className="w-5 h-5" />;
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
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading Academic Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Tab Navigation */}
      <div className="sticky top-0 z-10 bg-slate-50 p-4 md:p-6 pb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Academic Management
            </h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              {activeTab === 'batches' ? 'Batches & Enrollments' : 'Programs & Curriculum'}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowProgramModal(true)}
              className="inline-flex items-center rounded-xl bg-white px-4 py-2 text-[10px] font-black text-slate-700 shadow-sm ring-1 ring-inset ring-slate-200 hover:bg-slate-50 transition-all uppercase tracking-widest"
            >
              <Plus className="mr-2 h-3.5 w-3.5 text-slate-400" />
              New Program
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2 text-[10px] font-black text-white shadow-md shadow-indigo-200 hover:bg-indigo-500 transition-all uppercase tracking-widest"
            >
              <Plus className="mr-2 h-3.5 w-3.5" />
              New Batch
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-1 shadow-sm max-w-md">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('batches')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black transition-all uppercase tracking-widest ${activeTab === 'batches'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-500 hover:bg-slate-50'
                }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Batches
            </button>
            <button
              onClick={() => setActiveTab('programs')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black transition-all uppercase tracking-widest ${activeTab === 'programs'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-500 hover:bg-slate-50'
                }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Programs
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-6 pb-12">
        {/* Search & Filters */}
        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
              placeholder={activeTab === 'batches' ? "Search batches..." : "Search programs..."}
            />
          </div>
          <div className="flex gap-2">
            <div className="relative min-w-[180px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Building2 className="h-3.5 w-3.5 text-slate-400" />
              </div>
              <select
                value={centerFilter}
                onChange={(e) => setCenterFilter(e.target.value)}
                className="block w-full pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-700 appearance-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all uppercase tracking-widest"
              >
                <option value="all">All Centers</option>
                {centers.map((center) => (
                  <option key={center.id} value={center.id}>{center.name}</option>
                ))}
              </select>
            </div>
            {activeTab === 'batches' && (
              <div className="relative min-w-[180px]">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter className="h-3.5 w-3.5 text-slate-400" />
                </div>
                <select
                  value={programFilter}
                  onChange={(e) => setProgramFilter(e.target.value)}
                  className="block w-full pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-700 appearance-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all uppercase tracking-widest"
                >
                  <option value="all">All Programs</option>
                  {programs.map((program) => (
                    <option key={program.id} value={program.name}>{program.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'batches' ? (
            <motion.div
              key="batches-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredBatches.map((batch) => {
                  const status = getBatchStatus(batch);
                  const statusColor = getStatusColor(status);
                  const statusBadge = getStatusBadge(status);
                  const statusLabel = getStatusLabel(status);
                  const statusIcon = getStatusIcon(status);
                  const maxCapacity = 50;

                  return (
                    <div key={batch.id} className="group relative flex flex-col overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                      <div className={`absolute top-0 h-1.5 w-full ${statusColor}`}></div>

                      <div className="p-5 flex-1">
                        <div className="flex justify-between items-start mb-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ring-1 ring-inset ${statusBadge}`}>
                                {statusLabel}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{batch.code}</span>
                            </div>
                            <h3 className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                              {batch.name}
                            </h3>
                            <p className="text-xs font-bold text-slate-400 flex items-center gap-1">
                              <BookOpen className="w-3 h-3" /> {batch.program || 'General Track'}
                            </p>
                          </div>
                          <div className={`h-10 w-10 flex-shrink-0 rounded-xl ${status === 'active' ? 'bg-emerald-50 text-emerald-600' : status === 'upcoming' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'} flex items-center justify-center shadow-inner`}>
                            {statusIcon}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-50">
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Students</p>
                            <p className="mt-1 text-sm font-black text-slate-700">
                              {batch.students_count} <span className="text-xs font-bold text-slate-300">/ {maxCapacity}</span>
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              {status === 'upcoming' ? 'Commencing' : 'Launched'}
                            </p>
                            <p className="mt-1 text-sm font-black text-slate-700">
                              {status === 'upcoming' && batch.start_date
                                ? `${getDaysUntilStart(batch.start_date)} Days`
                                : formatDate(batch.start_date)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Syllabus Progress</span>
                            <span className="text-xs font-black text-indigo-600">68%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: '68%' }}
                              className="bg-indigo-600 h-full rounded-full shadow-sm"
                            ></motion.div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-50/50 px-5 py-3 flex items-center justify-between border-t border-slate-100">
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <Users className="w-3.5 h-3.5" />
                          <span>{batch.teachers_count} Mentors</span>
                        </div>
                        <button className="text-xs font-black text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group/btn">
                          Manage <ChevronRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredBatches.length === 0 && (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Layers className="w-10 h-10 text-slate-200" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mb-1">No batches found</h3>
                  <p className="text-sm font-bold text-slate-400">Try adjusting your filters or search query</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="programs-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {programsByCenter.map((centerGroup) => (
                <div key={centerGroup.id} className="space-y-4">
                  <div className="flex items-center gap-3 px-2">
                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900">{centerGroup.name}</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {centerGroup.programs.length} Active Programs
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {centerGroup.programs.map((program) => (
                      <div key={program.id} className="group bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                        <div className="flex justify-between items-start mb-4">
                          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                            <BookOpen className="w-5 h-5 text-slate-400 group-hover:text-indigo-600" />
                          </div>
                          <button className="p-2 text-slate-300 hover:text-indigo-600 transition-colors">
                            <ArrowUpRight className="w-4 h-4" />
                          </button>
                        </div>
                        <h4 className="text-sm font-black text-slate-800 mb-1">{program.name}</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                          {program.category || 'Academic Track'}
                        </p>
                        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                          <div className="flex items-center gap-1.5">
                            <div className="flex -space-x-2">
                              {[1, 2, 3].map(i => (
                                <div key={i} className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] font-black text-slate-400">
                                  {i}
                                </div>
                              ))}
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">12 Batches</span>
                          </div>
                          <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-widest">Active</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {programsByCenter.length === 0 && (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-10 h-10 text-slate-200" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mb-1">No programs found</h3>
                  <p className="text-sm font-bold text-slate-400">Try adjusting your filters or search query</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Create Batch Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-center justify-center min-h-screen p-4 text-center sm:p-0">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setShowCreateModal(false)}></div>
            <div className="relative transform overflow-hidden rounded-3xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
              <div className="bg-indigo-600 px-6 py-8 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center border border-white/30">
                      <PlusCircle className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black tracking-tight">Create New Batch</h3>
                      <p className="text-indigo-100 text-xs font-bold opacity-90 uppercase tracking-widest">Configure basic details</p>
                    </div>
                  </div>
                  <button onClick={() => setShowCreateModal(false)} className="text-white/60 hover:text-white transition-colors">
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleCreateBatch} className="p-8">
                {createError && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                    <p className="text-xs font-bold text-red-600">{createError}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Batch Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                      placeholder="e.g. Super 30 - Batch A"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Batch Code *</label>
                    <input
                      type="text"
                      required
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                      placeholder="e.g. BATCH-2025-A"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Center *</label>
                    <select
                      required
                      value={formData.center_id}
                      onChange={(e) => setFormData({ ...formData, center_id: e.target.value, program_id: '' })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="">Select Center</option>
                      {centers.map((center) => (
                        <option key={center.id} value={center.id}>{center.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Program (Optional)</label>
                    <select
                      value={formData.program_id}
                      onChange={(e) => setFormData({ ...formData, program_id: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="">Select Program</option>
                      {programs
                        .filter(p => !formData.center_id || String(p.center_id) === String(formData.center_id))
                        .map((program) => (
                          <option key={program.id} value={program.id}>{program.name}</option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Start Date</label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">End Date</label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="mt-8 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-2xl text-sm font-black hover:bg-slate-200 transition-all uppercase tracking-widest"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-[2] py-3.5 bg-indigo-600 text-white rounded-2xl text-sm font-black shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all flex items-center justify-center disabled:opacity-50 uppercase tracking-widest"
                  >
                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Batch'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Manage Programs Modal */}
      {showProgramModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-center justify-center min-h-screen p-4 text-center sm:p-0">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setShowProgramModal(false)}></div>
            <div className="relative transform overflow-hidden rounded-3xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
              <div className="bg-gradient-to-br from-indigo-600 to-violet-700 px-6 py-8 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center border border-white/30">
                      <GraduationCap className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black tracking-tight">Manage Programs</h3>
                      <p className="text-indigo-100 text-xs font-bold opacity-90 uppercase tracking-widest">Define academic tracks</p>
                    </div>
                  </div>
                  <button onClick={() => setShowProgramModal(false)} className="text-white/60 hover:text-white transition-colors">
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="p-8 space-y-8">
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Active Programs ({programs.length})</h4>
                  <div className="max-h-48 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                    {programs.map(p => (
                      <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 group hover:bg-indigo-50 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100">
                            <BookOpen className="w-4 h-4 text-indigo-600" />
                          </div>
                          <div>
                            <span className="block text-sm font-black text-slate-700">{p.name}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.center}</span>
                          </div>
                        </div>
                        <button className="text-slate-300 hover:text-indigo-600 transition-colors">
                          <ArrowUpRight className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                  <div className="relative flex justify-center"><span className="px-4 bg-white text-[10px] font-black text-slate-300 uppercase tracking-widest">New Program</span></div>
                </div>

                <form onSubmit={handleCreateProgram} className="space-y-5">
                  {programError && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                      <p className="text-xs font-bold text-red-600">{programError}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-5">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Program Name</label>
                      <input
                        type="text"
                        required
                        value={programData.name}
                        onChange={(e) => setProgramData({ ...programData, name: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                        placeholder="e.g. JEE Excellence 2026"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Category</label>
                        <input
                          type="text"
                          value={programData.category}
                          onChange={(e) => setProgramData({ ...programData, category: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                          placeholder="e.g. Engineering"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Center</label>
                        <select
                          required
                          value={programData.center_id}
                          onChange={(e) => setProgramData({ ...programData, center_id: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
                        >
                          <option value="">Select Center</option>
                          {centers.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowProgramModal(false)}
                      className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-2xl text-sm font-black hover:bg-slate-200 transition-all uppercase tracking-widest"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creatingProgram}
                      className="flex-[2] py-3.5 bg-indigo-600 text-white rounded-2xl text-sm font-black shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all flex items-center justify-center disabled:opacity-50 uppercase tracking-widest"
                    >
                      {creatingProgram ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Deploy Program'}
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
