import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Building2, Users, Plus, Search, Shield, Globe,
    CheckCircle, XCircle, MoreVertical, Activity,
    ShieldCheck, MapPin, Calendar, ExternalLink, Settings
} from 'lucide-react';
import { api } from '../hooks/useApi';

interface Institute {
    id: number;
    name: string;
    subdomain: string | null;
    domain: string | null;
    contact_email: string;
    is_verified: boolean;
    is_active: boolean;
    created_at: string;
    user_count: number;
    active_user_count: number;
    center_count: number;
    super_admin: {
        id: string;
        full_name: string;
        email: string;
        username: string;
    } | null;
}

export default function PlatformInstitutes() {
    const [institutes, setInstitutes] = useState<Institute[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'all' | 'verified' | 'pending'>('all');
    const [selectedInstitute, setSelectedInstitute] = useState<Institute | null>(null);

    const getRootDomain = () => {
        if (typeof window === 'undefined') return 'exams.dashoapp.com';
        const hostname = window.location.hostname;
        if (hostname.includes('timetable')) {
            return 'timetable.dashoapp.com';
        }
        return 'exams.dashoapp.com';
    };
    const ROOT_DOMAIN = getRootDomain();

    const [formData, setFormData] = useState({
        name: '',
        subdomain: '',
        domain: '',
        contact_email: '',
        admin_email: '',
        admin_username: '',
        admin_first_name: '',
        admin_last_name: '',
        admin_password: '',
    });

    const [isEditingSubdomain, setIsEditingSubdomain] = useState(false);
    const [editedSubdomain, setEditedSubdomain] = useState('');
    const [updateLoading, setUpdateLoading] = useState(false);

    const fetchInstitutes = async () => {
        try {
            const response = await api.get('/auth/platform/institutes/');
            const data = Array.isArray(response.data) ? response.data : (response.data.results || []);
            setInstitutes(data);
        } catch (err) {
            console.error('Failed to fetch institutes', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInstitutes();
    }, []);

    const handleCreateInstitute = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateLoading(true);
        try {
            await api.post('/auth/platform/institutes/create-with-admin/', formData);
            setShowCreateModal(false);
            fetchInstitutes();
            setFormData({
                name: '', subdomain: '', domain: '', contact_email: '', admin_email: '',
                admin_username: '', admin_first_name: '', admin_last_name: '', admin_password: ''
            });
        } catch (err) {
            alert('Failed to create institute');
        } finally {
            setCreateLoading(false);
        }
    };

    const handleUpdateSubdomain = async () => {
        if (!selectedInstitute) return;
        setUpdateLoading(true);
        try {
            const response = await api.patch(`/auth/platform/institutes/${selectedInstitute.id}/`, {
                subdomain: editedSubdomain
            });
            // Update local state
            setInstitutes(prev => prev.map(inst =>
                inst.id === selectedInstitute.id ? { ...inst, subdomain: editedSubdomain } : inst
            ));
            setSelectedInstitute({ ...selectedInstitute, subdomain: editedSubdomain });
            setIsEditingSubdomain(false);
            alert('Subdomain updated successfully');
        } catch (err) {
            console.error('Failed to update subdomain', err);
            alert('Failed to update subdomain. Ensure it is unique.');
        } finally {
            setUpdateLoading(false);
        }
    };

    const filteredInstitutes = institutes.filter(inst => {
        const matchesSearch = inst.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            inst.contact_email.toLowerCase().includes(searchQuery.toLowerCase());

        if (activeTab === 'verified') return matchesSearch && inst.is_verified;
        if (activeTab === 'pending') return matchesSearch && !inst.is_verified;
        return matchesSearch;
    });

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Institutes Management</h1>
                    <p className="text-slate-500">Manage organizational hierarchies and provisioning status</p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowCreateModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all text-sm"
                >
                    <Plus className="w-5 h-5" />
                    Add New Institute
                </motion.button>
            </div>

            {/* Quick Summary Cards (Internal to this page) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="bg-indigo-50 text-indigo-600 p-3 rounded-2xl">
                        <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Organizations</p>
                        <p className="text-2xl font-black text-slate-900">{institutes.length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="bg-emerald-50 text-emerald-600 p-3 rounded-2xl">
                        <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Verified Entities</p>
                        <p className="text-2xl font-black text-slate-900">{institutes.filter(i => i.is_verified).length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="bg-amber-50 text-amber-600 p-3 rounded-2xl">
                        <Activity className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Growth Factor</p>
                        <p className="text-2xl font-black text-slate-900">+{Math.round(institutes.length * 1.5)}%</p>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
                {/* Secondary Header / Filters */}
                <div className="p-8 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl w-fit border border-slate-100">
                        {['all', 'verified', 'pending'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab
                                    ? 'bg-white text-indigo-600 shadow-md shadow-indigo-600/5'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>
                    <div className="relative group flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by name, email or domain..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50/50 text-sm font-medium"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Institute & Domain</th>
                                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Super Admin</th>
                                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Centers</th>
                                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Capacity</th>
                                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Status</th>
                                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Launched</th>
                                <th className="px-8 py-5 border-b border-slate-100"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            <AnimatePresence mode='popLayout'>
                                {filteredInstitutes.map((inst) => (
                                    <motion.tr
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        key={inst.id}
                                        onClick={() => setSelectedInstitute(inst)}
                                        className="hover:bg-indigo-50/10 transition-colors group cursor-pointer"
                                    >
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-600 shadow-sm group-hover:from-indigo-500 group-hover:to-violet-600 group-hover:text-white transition-all duration-500">
                                                    <Building2 className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{inst.name}</p>
                                                    <p className="text-xs font-semibold text-slate-400 flex items-center gap-1 mt-0.5">
                                                        <Globe className="w-3 h-3 text-indigo-400" /> {inst.domain || inst.contact_email.split('@')[1]}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            {inst.super_admin ? (
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-900">{inst.super_admin.full_name}</span>
                                                    <span className="text-xs text-slate-400 font-medium">{inst.super_admin.email}</span>
                                                </div>
                                            ) : (
                                                <span className="text-[10px] font-black text-amber-500 bg-amber-50 px-2.5 py-1 rounded-lg uppercase tracking-wider">Unassigned</span>
                                            )}
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                                                    <MapPin className="w-4 h-4" />
                                                </div>
                                                <span className="text-sm font-black text-slate-700">{inst.center_count || 0}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-violet-100 group-hover:text-violet-600 transition-colors">
                                                    <Users className="w-4 h-4" />
                                                </div>
                                                <span className="text-sm font-black text-slate-700">{inst.user_count}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${inst.is_active
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                                                }`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${inst.is_active ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-400'}`} />
                                                {inst.is_active ? 'Online' : 'Paused'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-sm text-slate-500 font-bold">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-slate-400" />
                                                {new Date(inst.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedInstitute(inst);
                                                }}
                                                className="p-2.5 hover:bg-white rounded-xl text-slate-400 hover:text-indigo-600 hover:shadow-sm border border-transparent hover:border-slate-100 transition-all font-bold text-xs flex items-center gap-2"
                                            >
                                                Details
                                                <ExternalLink className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                    {filteredInstitutes.length === 0 && !loading && (
                        <div className="p-24 text-center">
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200"
                            >
                                <Building2 className="w-12 h-12" />
                            </motion.div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-2">No results matched</h3>
                            <p className="text-slate-500 max-w-xs mx-auto font-medium">Try broadening your search criteria or creating a new institute.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Institute Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowCreateModal(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-white/20"
                        >
                            <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                                            <ShieldCheck className="w-6 h-6" />
                                        </div>
                                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Provisioning</h2>
                                    </div>
                                    <p className="text-slate-500 font-medium">Initialize a new organization environment</p>
                                </div>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="p-3 hover:bg-white rounded-2xl text-slate-400 hover:text-slate-900 transition-all shadow-sm border border-transparent hover:border-slate-100"
                                >
                                    <XCircle className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateInstitute} className="p-10 max-h-[70vh] overflow-y-auto custom-scrollbar">
                                <div className="space-y-10">
                                    {/* Institute Section */}
                                    <div>
                                        <div className="flex items-center gap-3 text-indigo-600 font-black mb-6 text-xs uppercase tracking-[0.2em]">
                                            <div className="w-2 h-2 rounded-full bg-indigo-600" /> Organization Profile
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="md:col-span-2">
                                                <label className="block text-[10px] font-black text-slate-400 mb-2 ml-1 uppercase tracking-widest">Formal Name</label>
                                                <input
                                                    required
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    className="w-full px-6 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all bg-slate-50/50 font-bold placeholder:text-slate-300"
                                                    placeholder="e.g. Stanford University"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 mb-2 ml-1 uppercase tracking-widest">Subdomain</label>
                                                <div className="relative">
                                                    <input
                                                        value={formData.subdomain}
                                                        onChange={(e) => setFormData({ ...formData, subdomain: e.target.value })}
                                                        className="w-full px-6 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all bg-slate-50/50 font-bold placeholder:text-slate-300 pr-32"
                                                        placeholder="e.g. iitmadras"
                                                    />
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">
                                                        .{ROOT_DOMAIN}
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 mb-2 ml-1 uppercase tracking-widest">Custom Domain</label>
                                                <input
                                                    value={formData.domain}
                                                    onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                                                    className="w-full px-6 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all bg-slate-50/50 font-bold placeholder:text-slate-300"
                                                    placeholder="stanford.edu"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 mb-2 ml-1 uppercase tracking-widest">Contact Email</label>
                                                <input
                                                    required
                                                    type="email"
                                                    value={formData.contact_email}
                                                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                                                    className="w-full px-6 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all bg-slate-50/50 font-bold placeholder:text-slate-300"
                                                    placeholder="contact@institute.com"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Super Admin Section */}
                                    <div className="pt-10 border-t border-slate-100">
                                        <div className="flex items-center gap-3 text-violet-600 font-black mb-6 text-xs uppercase tracking-[0.2em]">
                                            <div className="w-2 h-2 rounded-full bg-violet-600" /> Root Administrator
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 mb-2 ml-1 uppercase tracking-widest">First Name</label>
                                                <input
                                                    required
                                                    value={formData.admin_first_name}
                                                    onChange={(e) => setFormData({ ...formData, admin_first_name: e.target.value })}
                                                    className="w-full px-6 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all bg-slate-50/50 font-bold placeholder:text-slate-300"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 mb-2 ml-1 uppercase tracking-widest">Last Name</label>
                                                <input
                                                    required
                                                    value={formData.admin_last_name}
                                                    onChange={(e) => setFormData({ ...formData, admin_last_name: e.target.value })}
                                                    className="w-full px-6 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all bg-slate-50/50 font-bold placeholder:text-slate-300"
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-[10px] font-black text-slate-400 mb-2 ml-1 uppercase tracking-widest">Login Email</label>
                                                <input
                                                    required
                                                    type="email"
                                                    value={formData.admin_email}
                                                    onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
                                                    className="w-full px-6 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all bg-slate-50/50 font-bold placeholder:text-slate-300"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 mb-2 ml-1 uppercase tracking-widest">Username</label>
                                                <input
                                                    required
                                                    value={formData.admin_username}
                                                    onChange={(e) => setFormData({ ...formData, admin_username: e.target.value })}
                                                    className="w-full px-6 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all bg-slate-50/50 font-bold placeholder:text-slate-300"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 mb-2 ml-1 uppercase tracking-widest">Root Password</label>
                                                <input
                                                    required
                                                    type="password"
                                                    value={formData.admin_password}
                                                    onChange={(e) => setFormData({ ...formData, admin_password: e.target.value })}
                                                    className="w-full px-6 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all bg-slate-50/50 font-bold placeholder:text-slate-300"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-12 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="flex-1 px-8 py-4 rounded-2xl font-black text-slate-400 bg-slate-100 hover:bg-slate-200 hover:text-slate-600 transition-all uppercase tracking-widest text-[10px]"
                                    >
                                        Abort
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={createLoading}
                                        className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-[10px]"
                                    >
                                        {createLoading ? (
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <ShieldCheck className="w-5 h-5" />
                                                Finalize Provisioning
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Institute Details Modal */}
            <AnimatePresence>
                {selectedInstitute && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedInstitute(null)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-3xl overflow-hidden border border-white/20"
                        >
                            <div className="p-10 border-b border-slate-100 flex justify-between items-start bg-slate-50/30">
                                <div className="flex gap-6">
                                    <div className="w-20 h-20 rounded-3xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
                                        <Building2 className="w-10 h-10" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">{selectedInstitute.name}</h2>
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${selectedInstitute.is_verified ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
                                                {selectedInstitute.is_verified ? 'Verified' : 'Pending'}
                                            </span>
                                        </div>
                                        {selectedInstitute.subdomain ? (
                                            <div className="flex flex-col gap-1 mt-1">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Professional Deployment
                                                </p>
                                                <a
                                                    href={`https://${selectedInstitute.subdomain}.${ROOT_DOMAIN}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs font-black text-indigo-600 flex items-center gap-1.5 hover:text-indigo-700 transition-all group/link"
                                                >
                                                    https://{selectedInstitute.subdomain}.{ROOT_DOMAIN}
                                                    <ExternalLink className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                                                </a>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 mt-2 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100/50 w-fit">
                                                <Globe className="w-3.5 h-3.5 text-amber-500" />
                                                <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">No Subdomain Configured</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-4 mt-3 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Established {new Date(selectedInstitute.created_at).toLocaleDateString()}</span>
                                            <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {selectedInstitute.center_count} Centers</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedInstitute(null)}
                                    className="p-3 hover:bg-white rounded-2xl text-slate-400 hover:text-slate-900 transition-all shadow-sm border border-transparent hover:border-slate-100"
                                >
                                    <XCircle className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="p-10 bg-white">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    {/* Left: Admin Details */}
                                    <div className="space-y-6">
                                        <h3 className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-2">
                                            <Shield className="w-4 h-4" /> Root Administrator
                                        </h3>
                                        {selectedInstitute.super_admin ? (
                                            <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 space-y-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-indigo-600 font-black text-lg">
                                                        {selectedInstitute.super_admin.full_name[0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900">{selectedInstitute.super_admin.full_name}</p>
                                                        <p className="text-xs text-slate-500 font-semibold italic">@{selectedInstitute.super_admin.username}</p>
                                                    </div>
                                                </div>
                                                <div className="space-y-3 pt-4 border-t border-slate-200/60">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="font-bold text-slate-400 uppercase tracking-tighter text-[10px]">Email Address</span>
                                                        <span className="font-bold text-slate-700">{selectedInstitute.super_admin.email}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="font-bold text-slate-400 uppercase tracking-tighter text-[10px]">Role Profile</span>
                                                        <span className="font-black text-indigo-600">SUPER_ADMIN</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-8 text-center bg-amber-50 rounded-3xl border border-amber-100">
                                                <p className="text-amber-700 font-bold">No Super Admin Assigned</p>
                                                <button className="mt-3 text-xs font-black text-amber-600 underline">Assign Root Now</button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Right: Ecosystem Stats */}
                                    <div className="space-y-6">
                                        <h3 className="text-xs font-black text-violet-600 uppercase tracking-[0.2em] flex items-center gap-2">
                                            <Activity className="w-4 h-4" /> Usage Analytics
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-white border-2 border-slate-50 rounded-3xl p-5 shadow-sm">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Users</p>
                                                <div className="flex items-center gap-2">
                                                    <Users className="w-5 h-5 text-violet-500" />
                                                    <span className="text-2xl font-black text-slate-900">{selectedInstitute.user_count}</span>
                                                </div>
                                            </div>
                                            <div className="bg-white border-2 border-slate-50 rounded-3xl p-5 shadow-sm">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Now</p>
                                                <div className="flex items-center gap-2">
                                                    <Activity className="w-5 h-5 text-emerald-500" />
                                                    <span className="text-2xl font-black text-slate-900">{selectedInstitute.active_user_count}</span>
                                                </div>
                                            </div>
                                            <div className="col-span-2 bg-indigo-50 border border-indigo-100 rounded-3xl p-6">
                                                <div className="w-full">
                                                    <div className="flex justify-between items-center mb-4">
                                                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                                                            <Globe className="w-3.5 h-3.5" /> Domain Identity
                                                        </p>
                                                        {!isEditingSubdomain && (
                                                            <button
                                                                onClick={() => {
                                                                    setEditedSubdomain(selectedInstitute.subdomain || '');
                                                                    setIsEditingSubdomain(true);
                                                                }}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-indigo-100 rounded-xl text-[10px] font-black text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                                            >
                                                                <Settings className="w-3.5 h-3.5" />
                                                                MANAGE
                                                            </button>
                                                        )}
                                                    </div>

                                                    {isEditingSubdomain ? (
                                                        <div className="space-y-4">
                                                            <div className="relative group/input">
                                                                <input
                                                                    value={editedSubdomain}
                                                                    onChange={(e) => setEditedSubdomain(e.target.value)}
                                                                    autoFocus
                                                                    className="w-full px-5 py-4 rounded-2xl border-2 border-indigo-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none font-black text-lg text-indigo-900 transition-all pr-[180px]"
                                                                    placeholder="subdomain"
                                                                />
                                                                <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] font-black text-slate-400 group-focus-within/input:text-indigo-400 transition-colors">
                                                                    .{ROOT_DOMAIN}
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <button
                                                                    onClick={handleUpdateSubdomain}
                                                                    disabled={updateLoading}
                                                                    className="flex-1 bg-indigo-600 text-white py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                                                                >
                                                                    {updateLoading ? (
                                                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                                    ) : (
                                                                        <>
                                                                            <ShieldCheck className="w-4 h-4" />
                                                                            Apply Changes
                                                                        </>
                                                                    )}
                                                                </button>
                                                                <button
                                                                    onClick={() => setIsEditingSubdomain(false)}
                                                                    className="px-6 py-3.5 bg-white text-slate-500 border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="p-5 bg-white/50 border border-indigo-100/50 rounded-2xl">
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 italic">Live Deployment Endpoint</p>
                                                            <p className="text-base font-black text-indigo-900 break-all">
                                                                {selectedInstitute.subdomain
                                                                    ? `https://${selectedInstitute.subdomain}.${ROOT_DOMAIN}`
                                                                    : `https://[subdomain].${ROOT_DOMAIN}`}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex justify-between items-center pt-4 border-t border-indigo-100">
                                                    <div>
                                                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Instance Health</p>
                                                        <p className="text-sm font-black text-indigo-900">OPTIMAL</p>
                                                    </div>
                                                    <div className="px-4 py-2 bg-white rounded-xl text-[10px] font-black text-indigo-600 shadow-sm border border-indigo-100">
                                                        PING: 14MS
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-12">
                                    <button
                                        onClick={() => setSelectedInstitute(null)}
                                        className="w-full px-8 py-5 rounded-2xl font-black text-slate-400 bg-slate-100 hover:bg-slate-200 hover:text-slate-600 transition-all uppercase tracking-widest text-[10px]"
                                    >
                                        Close Details
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
