import { useState, useEffect } from 'react';
import {
    X,
    Users,
    Settings,
    Save,
    Plus,
    Trash2,
    Loader2,
    Search,
    Mail,
    Phone,
    Calendar
} from 'lucide-react';
import { api } from '../../hooks/useApi';
import { motion, AnimatePresence } from 'framer-motion';

interface Batch {
    id: string;
    code: string;
    name: string;
    program: { id: string; name: string } | null;
    center_id: string | null;
    start_date: string | null;
    end_date: string | null;
}

interface Student {
    id: string;
    full_name: string;
    username: string;
    email: string;
}

interface ManageBatchModalProps {
    batch: Batch;
    onClose: () => void;
    onUpdate: () => void;
}

export default function ManageBatchModal({ batch, onClose, onUpdate }: ManageBatchModalProps) {
    const [activeTab, setActiveTab] = useState<'details' | 'students'>('details');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Edit Batch State
    const [editForm, setEditForm] = useState({
        name: batch.name,
        start_date: batch.start_date || '',
        end_date: batch.end_date || ''
    });

    // Students State
    const [students, setStudents] = useState<Student[]>([]);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [showAddStudent, setShowAddStudent] = useState(false);
    const [addStudentForm, setAddStudentForm] = useState({
        name: '',
        email: '',
        phone_number: '',
        date_of_birth: ''
    });

    // Existing Student Enrollment State
    const [enrollMode, setEnrollMode] = useState<'new' | 'existing'>('new');
    const [existingStudentSearch, setExistingStudentSearch] = useState('');
    const [searchResults, setSearchResults] = useState<Student[]>([]);
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        if (activeTab === 'students') {
            fetchStudents();
        }
    }, [activeTab]);

    const fetchStudents = async () => {
        setLoadingStudents(true);
        try {
            const response = await api.get(`/timetable/admin/batches/${batch.id}/students/`);
            setStudents(response.data);
        } catch (err) {
            console.error("Failed to fetch students", err);
            // Don't set global error, just maybe show empty or local error
        } finally {
            setLoadingStudents(false);
        }
    };

    const handleRemoveStudent = async (studentId: string) => {
        if (!window.confirm("Are you sure you want to remove this student from the batch?")) return;

        try {
            await api.delete(`/timetable/admin/batches/${batch.id}/students/${studentId}/`);
            setSuccess("Student removed successfully");
            fetchStudents(); // Refresh list
            onUpdate(); // Refresh counts
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to remove student');
        }
    };

    const handleSearchStudents = async (query: string) => {
        setExistingStudentSearch(query);
        if (!query.trim() || query.length < 2) {
            setSearchResults([]);
            return;
        }

        setSearching(true);
        try {
            // Use batch.center_id if available, otherwise try to use the one from response or context. 
            // Warning: batch prop might not have center_id depending on how it was fetched.
            // But usually for admin views it should be there.
            if (!batch.center_id) {
                console.error("Batch has no center_id");
                return;
            }

            const response = await api.get(`/timetable/centers/${batch.center_id}/users/`, {
                params: { role: 'student', search: query }
            });

            // Filter out students already in the list
            const existingIds = new Set(students.map(s => s.id));
            const available = response.data.results.filter((s: any) => !existingIds.has(s.id));
            setSearchResults(available);
        } catch (err) {
            console.error("Failed to search students", err);
        } finally {
            setSearching(false);
        }
    };

    const handleEnrollExistingStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStudentId) return;

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            await api.post(`/timetable/admin/batches/${batch.id}/enroll/`, {
                student_id: selectedStudentId
            });

            setSuccess("Student enrolled successfully!");
            setExistingStudentSearch('');
            setSearchResults([]);
            setSelectedStudentId(null);
            setShowAddStudent(false);
            fetchStudents(); // Refresh list
            onUpdate(); // Refresh counts
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to enroll student');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateBatch = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            await api.put(`/timetable/admin/batches/${batch.id}/update/`, {
                name: editForm.name,
                start_date: editForm.start_date || undefined,
                end_date: editForm.end_date || undefined
            });

            setSuccess("Batch updated successfully!");
            onUpdate();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to update batch');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteBatch = async () => {
        if (!window.confirm("Are you sure you want to delete this batch? This action cannot be undone.")) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await api.delete(`/timetable/admin/batches/${batch.id}/delete/`);
            onClose();
            onUpdate();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to delete batch');
            setLoading(false);
        }
    };

    const handleAddStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            await api.post('/timetable/admin/batches/add-student/', {
                batch_code: batch.code,
                name: addStudentForm.name,
                email: addStudentForm.email,
                phone_number: addStudentForm.phone_number,
                date_of_birth: addStudentForm.date_of_birth
            });

            setSuccess(`Student ${addStudentForm.name} added successfully!`);
            setAddStudentForm({ name: '', email: '', phone_number: '', date_of_birth: '' });
            setShowAddStudent(false);
            onUpdate(); // Refresh parent to update counts
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.detail || 'Failed to add student');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-center justify-center min-h-screen p-4 text-center sm:p-0">
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

                <div className="relative transform overflow-hidden rounded-3xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-4xl h-[600px] flex flex-col">
                    {/* Header */}
                    <div className="bg-slate-900 px-6 py-6 text-white shrink-0">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-black tracking-tight flex items-center gap-3">
                                    {batch.name}
                                    <span className="px-2 py-0.5 rounded-lg bg-white/10 text-[10px] font-bold uppercase tracking-widest border border-white/10">
                                        {batch.code}
                                    </span>
                                </h3>
                                <p className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-widest">Manage Batch & Enrollments</p>
                            </div>
                            <button onClick={onClose} className="text-white/60 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-6 mt-8 border-b border-white/10">
                            <button
                                onClick={() => setActiveTab('details')}
                                className={`pb-4 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === 'details' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                                    }`}
                            >
                                Batch Details
                                {activeTab === 'details' && (
                                    <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('students')}
                                className={`pb-4 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === 'students' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                                    }`}
                            >
                                Students & Enrollments
                                {activeTab === 'students' && (
                                    <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
                        <AnimatePresence mode="wait">
                            {activeTab === 'details' ? (
                                <motion.div
                                    key="details"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="max-w-2xl mx-auto"
                                >
                                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                                        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
                                            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
                                                <Settings className="w-5 h-5 text-slate-400" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-slate-900">Batch Configuration</h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">View batch settings</p>
                                            </div>
                                        </div>

                                        <form onSubmit={handleUpdateBatch} className="space-y-6">
                                            {error && (
                                                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
                                                    <X className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                                    <p className="text-xs font-bold text-red-600">{error}</p>
                                                </div>
                                            )}

                                            {success && (
                                                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3">
                                                    <Save className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                                    <p className="text-xs font-bold text-emerald-600">{success}</p>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="col-span-2">
                                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Batch Name</label>
                                                    <input
                                                        type="text"
                                                        value={editForm.name}
                                                        onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                                                        placeholder="e.g. Super 30 - Batch A"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Start Date</label>
                                                    <input
                                                        type="date"
                                                        value={editForm.start_date}
                                                        onChange={(e) => setEditForm(prev => ({ ...prev, start_date: e.target.value }))}
                                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">End Date</label>
                                                    <input
                                                        type="date"
                                                        value={editForm.end_date}
                                                        onChange={(e) => setEditForm(prev => ({ ...prev, end_date: e.target.value }))}
                                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                                                    />
                                                </div>
                                            </div>

                                            <div className="pt-4 flex gap-3 border-t border-slate-100">
                                                <button
                                                    type="button"
                                                    onClick={handleDeleteBatch}
                                                    className="px-4 py-3 bg-red-50 text-red-600 rounded-xl text-xs font-black hover:bg-red-100 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    Delete Batch
                                                </button>
                                                <div className="flex-1"></div>
                                                <button
                                                    type="submit"
                                                    disabled={loading}
                                                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:bg-indigo-500 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                                                >
                                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                                        <>
                                                            <Save className="w-4 h-4" />
                                                            Save Changes
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="students"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="max-w-3xl mx-auto"
                                >
                                    <div className="flex justify-between items-center mb-6">
                                        <div>
                                            <h4 className="text-lg font-black text-slate-900">Enrolled Students</h4>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Manage batch access</p>
                                        </div>
                                        <button
                                            onClick={() => setShowAddStudent(true)}
                                            className="inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2 text-[10px] font-black text-white shadow-md shadow-indigo-200 hover:bg-indigo-500 transition-all uppercase tracking-widest"
                                        >
                                            <Plus className="mr-2 h-3.5 w-3.5" />
                                            Add Student
                                        </button>
                                    </div>

                                    {error && (
                                        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                                            <X className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                            <p className="text-xs font-bold text-red-600">{error}</p>
                                        </div>
                                    )}

                                    {success && (
                                        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                                            <Users className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                            <p className="text-xs font-bold text-emerald-600">{success}</p>
                                        </div>
                                    )}

                                    {showAddStudent && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="mb-8"
                                        >
                                            <div className="bg-white rounded-2xl p-6 shadow-lg shadow-indigo-100 border border-indigo-100 relative overflow-hidden">
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -mr-10 -mt-10 opacity-50 pointer-events-none"></div>

                                                <div className="flex justify-between items-center mb-6 relative">
                                                    <h4 className="text-sm font-black text-indigo-900 uppercase tracking-widest flex items-center gap-2">
                                                        <span className="w-2 h-8 bg-indigo-500 rounded-full"></span>
                                                        Add Student
                                                    </h4>
                                                    <button onClick={() => setShowAddStudent(false)} className="text-slate-400 hover:text-slate-600">
                                                        <X className="w-5 h-5" />
                                                    </button>
                                                </div>

                                                {/* Enrollment Mode Toggle */}
                                                <div className="flex p-1 bg-slate-100 rounded-xl mb-6 relative w-fit">
                                                    <button
                                                        type="button"
                                                        onClick={() => setEnrollMode('new')}
                                                        className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${enrollMode === 'new' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                                    >
                                                        New Student
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setEnrollMode('existing')}
                                                        className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${enrollMode === 'existing' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                                    >
                                                        Existing Student
                                                    </button>
                                                </div>

                                                {enrollMode === 'new' ? (
                                                    <form onSubmit={handleAddStudent} className="space-y-4 relative">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Full Name *</label>
                                                                <div className="relative">
                                                                    <Users className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                                                    <input
                                                                        type="text"
                                                                        required
                                                                        value={addStudentForm.name}
                                                                        onChange={(e) => setAddStudentForm({ ...addStudentForm, name: e.target.value })}
                                                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                                                                        placeholder="Student Name"
                                                                    />
                                                                </div>
                                                            </div>

                                                            <div>
                                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Email (Optional)</label>
                                                                <div className="relative">
                                                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                                                    <input
                                                                        type="email"
                                                                        value={addStudentForm.email}
                                                                        onChange={(e) => setAddStudentForm({ ...addStudentForm, email: e.target.value })}
                                                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                                                                        placeholder="student@example.com"
                                                                    />
                                                                </div>
                                                            </div>

                                                            <div>
                                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Phone (Optional)</label>
                                                                <div className="relative">
                                                                    <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                                                    <input
                                                                        type="text"
                                                                        value={addStudentForm.phone_number}
                                                                        onChange={(e) => setAddStudentForm({ ...addStudentForm, phone_number: e.target.value })}
                                                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                                                                        placeholder="9876543210"
                                                                    />
                                                                </div>
                                                            </div>

                                                            <div>
                                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Date of Birth (Optional)</label>
                                                                <div className="relative">
                                                                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                                                    <input
                                                                        type="date"
                                                                        value={addStudentForm.date_of_birth}
                                                                        onChange={(e) => setAddStudentForm({ ...addStudentForm, date_of_birth: e.target.value })}
                                                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex justify-end pt-2">
                                                            <button
                                                                type="submit"
                                                                disabled={loading}
                                                                className="inline-flex items-center rounded-xl bg-indigo-600 px-6 py-3 text-xs font-black text-white shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:bg-indigo-500 transition-all uppercase tracking-widest"
                                                            >
                                                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create & Enroll'}
                                                            </button>
                                                        </div>
                                                    </form>
                                                ) : (
                                                    <form onSubmit={handleEnrollExistingStudent} className="space-y-4 relative">
                                                        <div>
                                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Search Student</label>
                                                            <div className="relative">
                                                                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                                                <input
                                                                    type="text"
                                                                    value={existingStudentSearch}
                                                                    onChange={(e) => handleSearchStudents(e.target.value)}
                                                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                                                                    placeholder="Search by name, email or username..."
                                                                />
                                                                {searching && (
                                                                    <div className="absolute right-3 top-3">
                                                                        <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {/* Search Results Dropdown */}
                                                            {(searchResults.length > 0 || (existingStudentSearch.length >= 2 && !searching)) && (
                                                                <div className="mt-2 bg-white rounded-xl border border-slate-100 shadow-xl max-h-48 overflow-y-auto z-10">
                                                                    {searchResults.length > 0 ? (
                                                                        searchResults.map(student => (
                                                                            <div
                                                                                key={student.id}
                                                                                onClick={() => {
                                                                                    setSelectedStudentId(student.id);
                                                                                    setExistingStudentSearch(student.full_name || student.username); // Show selection
                                                                                    setSearchResults([]); // Hide list
                                                                                }}
                                                                                className={`p-3 hover:bg-slate-50 cursor-pointer flex items-center gap-3 transition-colors ${selectedStudentId === student.id ? 'bg-indigo-50' : ''}`}
                                                                            >
                                                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                                                                                    {(student.full_name || student.username).charAt(0)}
                                                                                </div>
                                                                                <div>
                                                                                    <div className="text-sm font-bold text-slate-700">{student.full_name || student.username}</div>
                                                                                    <div className="text-xs text-slate-400">{student.email}</div>
                                                                                </div>
                                                                            </div>
                                                                        ))
                                                                    ) : (
                                                                        <div className="p-4 text-center text-xs text-slate-400 font-bold">No students found.</div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {selectedStudentId && (
                                                            <div className="flex justify-end pt-2">
                                                                <button
                                                                    type="submit"
                                                                    disabled={loading}
                                                                    className="inline-flex items-center rounded-xl bg-indigo-600 px-6 py-3 text-xs font-black text-white shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:bg-indigo-500 transition-all uppercase tracking-widest"
                                                                >
                                                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enroll Selected Student'}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </form>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}

                                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead className="bg-slate-50 border-b border-slate-200">
                                                    <tr>
                                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Username</th>
                                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {loadingStudents ? (
                                                        <tr>
                                                            <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                                                                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                                                <span className="text-xs font-bold">Loading students...</span>
                                                            </td>
                                                        </tr>
                                                    ) : students.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                                                                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                                                    <Users className="w-6 h-6 text-slate-300" />
                                                                </div>
                                                                <p className="text-xs font-bold">No students enrolled yet.</p>
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        students.map((student) => (
                                                            <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                                                                <td className="px-6 py-4">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs">
                                                                            {student.full_name?.charAt(0) || 'S'}
                                                                        </div>
                                                                        <div>
                                                                            <div className="text-sm font-bold text-slate-900">{student.full_name}</div>
                                                                            <div className="text-xs text-slate-500">{student.email}</div>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <span className="text-xs font-mono font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded">
                                                                        {student.username}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4 text-right">
                                                                    <button
                                                                        onClick={() => handleRemoveStudent(student.id)}
                                                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                                        title="Remove student"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div >
    );
}
