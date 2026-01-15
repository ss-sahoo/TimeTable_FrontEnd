import { useState, useEffect, useRef } from "react";
import { api } from "../../hooks/useApi";
import { useAuthContext } from "../../contexts/AuthContext";
import { MapPin, Plus, Edit, Trash2, Search, Filter, Users, Building, MoreVertical, AlertCircle, X, Shield, User, GraduationCap, Save, Loader2, ArrowLeft, Upload, FileSpreadsheet, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Center {
    id: string;
    name: string;
    city: string;
    address?: string;
    institute_id: number;
    created_at?: string;
}

interface CenterUser {
    id: number | string;
    username: string;
    email: string;
    role: string;
    full_name?: string;
    teacher_subjects?: string;
    student_code?: string;
}

const CentersContent = () => {
    const { user } = useAuthContext();
    const [viewMode, setViewMode] = useState<'list' | 'details'>('list');
    const [centers, setCenters] = useState<Center[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Modal States
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [selectedCenter, setSelectedCenter] = useState<Center | null>(null);
    const [formData, setFormData] = useState({ name: '', city: '', address: '' });
    const [submitting, setSubmitting] = useState(false);

    // Center Details States
    const [centerUsers, setCenterUsers] = useState<CenterUser[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [userSearchQuery, setUserSearchQuery] = useState("");
    const [userRoleFilter, setUserRoleFilter] = useState<string>('all');

    // User Management States
    const [showAddUserModal, setShowAddUserModal] = useState(false);
    const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        phone: '',
        role: 'teacher',
        employee_id: '',
        subjects: '',
        date_of_birth: '',
        batch_code: ''
    });
    const [creatingUser, setCreatingUser] = useState(false);

    // Bulk Upload States
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [bulkFile, setBulkFile] = useState<File | null>(null);
    const [uploadingBulk, setUploadingBulk] = useState(false);
    const [bulkUploadRole, setBulkUploadRole] = useState('teacher');
    
    // Bulk Upload Results States (to show credentials)
    const [showBulkResultsModal, setShowBulkResultsModal] = useState(false);
    const [bulkUploadResults, setBulkUploadResults] = useState<{
        total: number;
        success: number;
        failed: number;
        created_users: Array<{
            name: string;
            username: string;
            password: string;
            email: string;
        }>;
        errors: Array<{
            row: number;
            error: string;
        }>;
    } | null>(null);


    const fetchCenters = async () => {
        const instituteId = user?.institute_id || user?.institute?.id;
        if (!instituteId) return;
        setLoading(true);
        try {
            const response = await api.get(`/timetable/centers/?institute_id=${instituteId}`);
            const data = response.data.results || response.data;
            setCenters(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching centers:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCenters();
    }, [user]);

    const handleOpenCreate = () => {
        setModalMode('create');
        setFormData({ name: '', city: '', address: '' });
        setSelectedCenter(null);
        setShowModal(true);
    };

    const handleOpenEdit = (center: Center, e: React.MouseEvent) => {
        e.stopPropagation();
        setModalMode('edit');
        setFormData({ name: center.name, city: center.city, address: center.address || '' });
        setSelectedCenter(center);
        setShowModal(true);
    };

    const handleSubmitCenter = async (e: React.FormEvent) => {
        e.preventDefault();
        const instituteId = user?.institute_id || user?.institute?.id;
        if (!instituteId) return;

        setSubmitting(true);
        try {
            if (modalMode === 'create') {
                await api.post('/timetable/superadmin/centers/create/', {
                    ...formData,
                    institute_id: instituteId
                });
            } else if (modalMode === 'edit' && selectedCenter) {
                await api.put(`/timetable/superadmin/centers/${selectedCenter.id}/update/`, formData);
            }
            setShowModal(false);
            fetchCenters();
        } catch (error) {
            console.error("Error saving center:", error);
            alert("Failed to save center. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteCenter = async (centerId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this center? This action cannot be undone.")) return;

        try {
            await api.delete(`/timetable/superadmin/centers/${centerId}/delete/`);
            fetchCenters();
        } catch (error) {
            console.error("Error deleting center:", error);
            alert("Failed to delete center.");
        }
    };

    const fetchCenterUsers = async (centerId: string) => {
        setLoadingUsers(true);
        try {
            const response = await api.get(`/timetable/centers/${centerId}/users/`);
            const data = response.data.results || response.data;
            setCenterUsers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching center users:", error);
            setCenterUsers([]);
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleCenterClick = (center: Center) => {
        setSelectedCenter(center);
        setViewMode('details');
        fetchCenterUsers(center.id);
    };

    const handleBackToList = () => {
        setViewMode('list');
        setSelectedCenter(null);
        setCenterUsers([]);
    };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCenter) return;
        setCreatingUser(true);
        try {
            let endpoint = '';
            const payload: any = {
                center_id: selectedCenter.id,
                name: newUser.name,
                email: newUser.email,
                phone_number: newUser.phone,
            };

            if (newUser.role === 'admin') {
                endpoint = '/timetable/superadmin/admins/create/';
            } else if (newUser.role === 'teacher') {
                endpoint = '/timetable/superadmin/teachers/create/';
                payload.employee_id = newUser.employee_id;
                payload.subjects = newUser.subjects;
            } else if (newUser.role === 'student') {
                endpoint = '/timetable/superadmin/students/create/';
                payload.batch_code = newUser.batch_code;
                payload.date_of_birth = newUser.date_of_birth;
            } else if (newUser.role === 'staff') {
                endpoint = '/timetable/superadmin/staff/create/';
            } else {
                endpoint = '/auth/users/';
                payload.role = newUser.role;
            }

            const response = await api.post(endpoint, payload);
            
            // Show credentials in alert (the response contains username and password)
            const { username, password } = response.data;
            if (username && password) {
                alert(`✅ User Created Successfully!\n\n📋 Login Credentials:\n👤 Username: ${username}\n🔑 Password: ${password}\n\n⚠️ Please save these credentials - they cannot be recovered later!`);
            }
            
            setShowAddUserModal(false);
            fetchCenterUsers(selectedCenter.id);
            setNewUser({
                name: '', email: '', phone: '', role: 'teacher',
                employee_id: '', subjects: '', date_of_birth: '', batch_code: ''
            });
        } catch (error) {
            console.error("Error creating user:", error);
            alert("Failed to create user. Please check the console for details.");
        } finally {
            setCreatingUser(false);
        }
    };

    const handleBulkUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCenter || !bulkFile) return;

        setUploadingBulk(true);
        const formData = new FormData();
        formData.append('file', bulkFile);
        formData.append('center_id', selectedCenter.id);

        let endpoint = '/timetable/superadmin/teachers/bulk_create/';
        if (bulkUploadRole === 'student') {
            endpoint = '/timetable/superadmin/students/bulk_create/';
        } else if (bulkUploadRole === 'staff') {
            endpoint = '/timetable/superadmin/staff/bulk_create/';
        }

        try {
            const response = await api.post(endpoint, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            
            // Extract created users from response based on role
            const createdKey = bulkUploadRole === 'teacher' ? 'created_teachers' : 
                              bulkUploadRole === 'student' ? 'created_students' : 'created_staff';
            
            setBulkUploadResults({
                total: response.data.total || 0,
                success: response.data.success || 0,
                failed: response.data.failed || 0,
                created_users: response.data[createdKey] || [],
                errors: response.data.errors || [],
            });
            
            setShowBulkUploadModal(false);
            setBulkFile(null);
            setShowBulkResultsModal(true); // Show results modal with credentials
            fetchCenterUsers(selectedCenter.id);
        } catch (error: any) {
            console.error("Error uploading file:", error);
            const errorMsg = error.response?.data?.detail || "Failed to upload file. Please ensure the format is correct.";
            alert(errorMsg);
        } finally {
            setUploadingBulk(false);
        }
    };

    const filteredCenters = centers.filter(center =>
        center.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        center.city.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredUsers = centerUsers.filter(u => {
        const matchesSearch = (u.full_name || u.username).toLowerCase().includes(userSearchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(userSearchQuery.toLowerCase());
        const matchesRole = userRoleFilter === 'all' || u.role.toLowerCase() === userRoleFilter.toLowerCase();
        return matchesSearch && matchesRole;
    });

    if (viewMode === 'details' && selectedCenter) {
        return (
            <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleBackToList}
                        className="p-2 rounded-xl bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors text-slate-500 dark:text-gray-400"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            {selectedCenter.name}
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider border border-blue-100 dark:border-blue-800">
                                {selectedCenter.city}
                            </span>
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                            <MapPin size={14} />
                            {selectedCenter.address || "No address provided"}
                        </p>
                    </div>
                </div>

                {/* Content Tabs/Area */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-gray-900/50">
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
                            <button className="px-4 py-2 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-slate-200 dark:border-gray-700 text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
                                <Users size={16} />
                                People
                                <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-300 text-xs">
                                    {centerUsers.length}
                                </span>
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowBulkUploadModal(true)}
                                className="px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-100 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors flex items-center gap-2"
                            >
                                <FileSpreadsheet size={16} />
                                Bulk Upload
                            </button>
                            <button
                                onClick={() => setShowAddUserModal(true)}
                                className="px-3 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 flex items-center gap-2"
                            >
                                <Plus size={16} />
                                Add User
                            </button>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="p-4 border-b border-slate-100 dark:border-gray-700 flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search people..."
                                value={userSearchQuery}
                                onChange={(e) => setUserSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                        </div>
                        <div className="flex gap-2">
                            <select
                                value={userRoleFilter}
                                onChange={(e) => setUserRoleFilter(e.target.value)}
                                className="px-3 py-2 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            >
                                <option value="all">All Roles</option>
                                <option value="teacher">Teachers</option>
                                <option value="student">Students</option>
                                <option value="admin">Admins</option>
                                <option value="staff">Staff</option>
                            </select>
                        </div>
                    </div>

                    {/* Users List */}
                    <div className="overflow-x-auto">
                        {loadingUsers ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-3">
                                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                                <p className="text-sm text-slate-500">Loading users...</p>
                            </div>
                        ) : filteredUsers.length > 0 ? (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 dark:bg-gray-900/50 border-b border-slate-100 dark:border-gray-700">
                                        <th className="p-4 text-xs font-bold text-slate-500 uppercase">User</th>
                                        <th className="p-4 text-xs font-bold text-slate-500 uppercase">Role</th>
                                        <th className="p-4 text-xs font-bold text-slate-500 uppercase">Details</th>
                                        <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                                    {filteredUsers.map((u) => (
                                        <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-gray-900/50 transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-gray-800 flex items-center justify-center text-slate-600 dark:text-gray-300 font-bold text-xs border border-slate-200 dark:border-gray-700">
                                                        {u.username.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 dark:text-white text-sm">{u.full_name || u.username}</p>
                                                        <p className="text-xs text-slate-500">{u.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${u.role === 'teacher' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                                    u.role === 'student' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                        u.role === 'admin' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                                            'bg-slate-50 text-slate-600 border-slate-100'
                                                    }`}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-xs text-slate-600 dark:text-gray-400">
                                                    {u.role === 'teacher' && u.teacher_subjects && (
                                                        <span className="flex items-center gap-1"><GraduationCap size={12} /> {u.teacher_subjects}</span>
                                                    )}
                                                    {u.role === 'student' && u.student_code && (
                                                        <span className="flex items-center gap-1"><Shield size={12} /> {u.student_code}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <button className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                    <Trash2 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="py-20 text-center">
                                <Users size={40} className="mx-auto text-slate-200 mb-4" />
                                <p className="text-slate-500">No users found matching your filters.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bulk Upload Modal */}
                <AnimatePresence>
                    {showBulkUploadModal && (
                        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                                onClick={() => setShowBulkUploadModal(false)}
                            />
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                                className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        <FileSpreadsheet className="text-emerald-600" size={24} />
                                        Bulk Upload Users
                                    </h3>
                                    <button onClick={() => setShowBulkUploadModal(false)} className="text-slate-400 hover:text-slate-600">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {/* Role Selector */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-gray-300 mb-1.5">Select Role</label>
                                        <div className="flex gap-2">
                                            {['teacher', 'student', 'staff'].map((role) => (
                                                <button
                                                    key={role}
                                                    onClick={() => setBulkUploadRole(role)}
                                                    className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all border ${bulkUploadRole === role
                                                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
                                                        : 'bg-slate-50 dark:bg-gray-900 text-slate-600 dark:text-gray-400 border-slate-200 dark:border-gray-700 hover:bg-slate-100 dark:hover:bg-gray-800'
                                                        }`}
                                                >
                                                    {role}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                                        <h4 className="text-sm font-bold text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-2">
                                            <Download size={16} />
                                            Download Template
                                        </h4>
                                        <p className="text-xs text-blue-600 dark:text-blue-400 mb-3">
                                            Use our standard Excel template for <span className="font-bold capitalize">{bulkUploadRole}s</span> to ensure your data is formatted correctly.
                                        </p>
                                        <button
                                            onClick={() => {
                                                const filename = `${bulkUploadRole}_bulk_upload_template.xlsx`;
                                                const link = document.createElement('a');
                                                link.href = `/templates/${filename}`;
                                                link.download = filename;
                                                document.body.appendChild(link);
                                                link.click();
                                                document.body.removeChild(link);
                                            }}
                                            className="text-xs font-bold text-white bg-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            Download {bulkUploadRole} Template
                                        </button>
                                    </div>

                                    <div
                                        className="border-2 border-dashed border-slate-200 dark:border-gray-700 rounded-xl p-8 text-center hover:border-blue-500 transition-colors cursor-pointer bg-slate-50 dark:bg-gray-900/50"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            accept=".xlsx,.xls,.csv"
                                            onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
                                        />
                                        <Upload size={32} className="mx-auto text-slate-400 mb-3" />
                                        <p className="text-sm font-bold text-slate-700 dark:text-gray-300">
                                            {bulkFile ? bulkFile.name : "Click to upload file"}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            Supports .xlsx, .xls, .csv
                                        </p>
                                    </div>

                                    <button
                                        onClick={handleBulkUpload}
                                        disabled={!bulkFile || uploadingBulk}
                                        className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {uploadingBulk ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                        {uploadingBulk ? 'Uploading...' : 'Process Upload'}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Add User Modal (Reused) */}
                <AnimatePresence>
                    {showAddUserModal && (
                        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                                onClick={() => setShowAddUserModal(false)}
                            />
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                                className="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto"
                            >
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Add User to Center</h3>
                                <form className="space-y-3" onSubmit={handleAddUser}>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-gray-300 mb-1.5">Role</label>
                                        <select
                                            value={newUser.role}
                                            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-gray-100 transition-all text-xs font-medium"
                                        >
                                            <option value="teacher">Teacher</option>
                                            <option value="student">Student</option>
                                            <option value="admin">Center Admin</option>
                                            <option value="staff">Staff</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-gray-300 mb-1.5">Full Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={newUser.name}
                                            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-gray-100 transition-all text-xs font-medium"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-gray-300 mb-1.5">Email Address</label>
                                        <input
                                            type="email"
                                            required
                                            value={newUser.email}
                                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-gray-100 transition-all text-xs font-medium"
                                            placeholder="john@example.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-gray-300 mb-1.5">Phone Number</label>
                                        <input
                                            type="tel"
                                            required
                                            value={newUser.phone}
                                            onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-gray-100 transition-all text-xs font-medium"
                                            placeholder="9876543210"
                                        />
                                    </div>

                                    {newUser.role === 'teacher' && (
                                        <>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 dark:text-gray-300 mb-1.5">Employee ID</label>
                                                <input
                                                    type="text"
                                                    value={newUser.employee_id}
                                                    onChange={(e) => setNewUser({ ...newUser, employee_id: e.target.value })}
                                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-gray-100 transition-all text-xs font-medium"
                                                    placeholder="EMP-001"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 dark:text-gray-300 mb-1.5">Subjects</label>
                                                <input
                                                    type="text"
                                                    value={newUser.subjects}
                                                    onChange={(e) => setNewUser({ ...newUser, subjects: e.target.value })}
                                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-gray-100 transition-all text-xs font-medium"
                                                    placeholder="Physics, Chemistry"
                                                />
                                            </div>
                                        </>
                                    )}

                                    {newUser.role === 'student' && (
                                        <>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 dark:text-gray-300 mb-1.5">Batch Code</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={newUser.batch_code}
                                                    onChange={(e) => setNewUser({ ...newUser, batch_code: e.target.value })}
                                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-gray-100 transition-all text-xs font-medium"
                                                    placeholder="BATCH-001"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 dark:text-gray-300 mb-1.5">Date of Birth</label>
                                                <input
                                                    type="date"
                                                    required
                                                    value={newUser.date_of_birth}
                                                    onChange={(e) => setNewUser({ ...newUser, date_of_birth: e.target.value })}
                                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-gray-100 transition-all text-xs font-medium"
                                                />
                                            </div>
                                        </>
                                    )}

                                    <div className="flex gap-3 pt-3">
                                        <button
                                            type="button"
                                            onClick={() => setShowAddUserModal(false)}
                                            className="flex-1 px-4 py-2 bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-300 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-gray-600 transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={creatingUser}
                                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
                                        >
                                            {creatingUser ? 'Adding...' : 'Add User'}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    return (
        <div className="w-full space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Center Management</h2>
                    <p className="text-slate-500 dark:text-gray-400 text-xs mt-1">Manage branches and locations for {user?.institute?.name || user?.institute_name || 'your institute'}</p>
                </div>
                <button
                    onClick={handleOpenCreate}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 font-bold text-xs"
                >
                    <Plus size={16} />
                    Add Center
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500" size={16} />
                        <input
                            type="text"
                            placeholder="Search centers..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-gray-100 transition-all text-xs font-medium"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col justify-center items-center h-64 gap-3">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                        <p className="text-xs text-slate-500 dark:text-gray-400 font-medium">Loading centers...</p>
                    </div>
                ) : filteredCenters.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-gray-900/50 border-b border-slate-100 dark:border-gray-700">
                                    <th className="p-4 text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Center Name</th>
                                    <th className="p-4 text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Location</th>
                                    <th className="p-4 text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Address</th>
                                    <th className="p-4 text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                                {filteredCenters.map((center) => (
                                    <tr
                                        key={center.id}
                                        className="hover:bg-slate-50/80 dark:hover:bg-gray-900/80 transition-colors group cursor-pointer"
                                        onClick={() => handleCenterClick(center)}
                                    >
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-800">
                                                    <MapPin size={16} />
                                                </div>
                                                <span className="font-bold text-slate-900 dark:text-white text-xs group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{center.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-gray-400 text-[10px] font-bold uppercase tracking-wide border border-slate-200 dark:border-gray-700">
                                                {center.city}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-xs text-slate-500 dark:text-gray-400 truncate max-w-[200px] block" title={center.address}>
                                                {center.address || '-'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={(e) => handleOpenEdit(center, e)}
                                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
                                                >
                                                    <Edit size={14} />
                                                </button>
                                                <button
                                                    onClick={(e) => handleDeleteCenter(center.id, e)}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                        <div className="w-16 h-16 bg-slate-50 dark:bg-gray-900 rounded-full flex items-center justify-center mb-4 border border-slate-100 dark:border-gray-800">
                            <MapPin size={32} className="text-slate-300 dark:text-gray-600" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">No centers found</h3>
                        <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 max-w-xs mx-auto">
                            {searchQuery ? `No matches for "${searchQuery}"` : "Add your first center to get started."}
                        </p>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                            onClick={() => setShowModal(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 10 }}
                            className="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-slate-200 dark:border-gray-700 overflow-hidden"
                        >
                            <div className="px-5 py-4 border-b border-slate-100 dark:border-gray-700 flex items-center justify-between bg-slate-50/50 dark:bg-gray-900/50">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                    {modalMode === 'create' ? 'Add New Center' : 'Edit Center'}
                                </h3>
                                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-gray-300">
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmitCenter} className="p-5 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-gray-300 mb-1.5">Center Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-gray-100 transition-all text-xs font-medium"
                                        placeholder="e.g. Main Campus"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-gray-300 mb-1.5">City</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-gray-100 transition-all text-xs font-medium"
                                        placeholder="e.g. New York"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-gray-300 mb-1.5">Address</label>
                                    <textarea
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-gray-100 transition-all text-xs font-medium h-20 resize-none"
                                        placeholder="Full address..."
                                    />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 px-4 py-2 bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-300 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-gray-600 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-70 flex items-center justify-center gap-2"
                                    >
                                        {submitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                        {modalMode === 'create' ? 'Create' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Bulk Upload Results Modal - Shows Credentials */}
            <AnimatePresence>
                {showBulkResultsModal && bulkUploadResults && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                            onClick={() => setShowBulkResultsModal(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-h-[85vh] overflow-hidden flex flex-col"
                        >
                            {/* Header */}
                            <div className="px-6 py-4 border-b border-slate-200 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        <Shield className="text-emerald-600" size={20} />
                                        Bulk Upload Results
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                                        {bulkUploadResults.success} of {bulkUploadResults.total} users created successfully
                                    </p>
                                </div>
                                <button 
                                    onClick={() => setShowBulkResultsModal(false)} 
                                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Stats Summary */}
                            <div className="px-6 py-3 bg-slate-50 dark:bg-gray-900/50 border-b border-slate-200 dark:border-gray-700 flex gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                    <span className="text-xs font-bold text-slate-700 dark:text-gray-300">Success: {bulkUploadResults.success}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                    <span className="text-xs font-bold text-slate-700 dark:text-gray-300">Failed: {bulkUploadResults.failed}</span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-6">
                                {bulkUploadResults.created_users.length > 0 && (
                                    <div className="mb-6">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                                <User size={16} className="text-emerald-600" />
                                                Created Users - Login Credentials
                                            </h4>
                                            <button
                                                onClick={() => {
                                                    const csvContent = "Name,Username,Password,Email\n" + 
                                                        bulkUploadResults.created_users.map(u => 
                                                            `"${u.name}","${u.username}","${u.password}","${u.email}"`
                                                        ).join("\n");
                                                    const blob = new Blob([csvContent], { type: 'text/csv' });
                                                    const url = URL.createObjectURL(blob);
                                                    const a = document.createElement('a');
                                                    a.href = url;
                                                    a.download = `credentials_${new Date().toISOString().split('T')[0]}.csv`;
                                                    a.click();
                                                    URL.revokeObjectURL(url);
                                                }}
                                                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5"
                                            >
                                                <Download size={14} />
                                                Download CSV
                                            </button>
                                        </div>
                                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 mb-4">
                                            <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                                                ⚠️ Important: Save these credentials! Passwords cannot be recovered later.
                                            </p>
                                        </div>
                                        <div className="border border-slate-200 dark:border-gray-700 rounded-xl overflow-hidden">
                                            <table className="w-full text-left">
                                                <thead className="bg-slate-50 dark:bg-gray-900/50">
                                                    <tr>
                                                        <th className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase">Name</th>
                                                        <th className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase">Username</th>
                                                        <th className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase">Password</th>
                                                        <th className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase">Email</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                                                    {bulkUploadResults.created_users.map((user, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-gray-900/50">
                                                            <td className="px-4 py-2 text-xs font-medium text-slate-900 dark:text-white">{user.name}</td>
                                                            <td className="px-4 py-2">
                                                                <code className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-xs font-mono">
                                                                    {user.username}
                                                                </code>
                                                            </td>
                                                            <td className="px-4 py-2">
                                                                <code className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded text-xs font-mono">
                                                                    {user.password}
                                                                </code>
                                                            </td>
                                                            <td className="px-4 py-2 text-xs text-slate-500 dark:text-gray-400">{user.email}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {bulkUploadResults.errors.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                                            <AlertCircle size={16} className="text-red-600" />
                                            Failed Records
                                        </h4>
                                        <div className="space-y-2">
                                            {bulkUploadResults.errors.map((err, idx) => (
                                                <div key={idx} className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                                    <p className="text-xs font-bold text-red-700 dark:text-red-400">Row {err.row}</p>
                                                    <p className="text-xs text-red-600 dark:text-red-300 mt-0.5">{err.error}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 border-t border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900/50">
                                <button
                                    onClick={() => setShowBulkResultsModal(false)}
                                    className="w-full py-2.5 bg-slate-900 dark:bg-gray-700 text-white rounded-xl text-sm font-bold hover:bg-slate-800 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CentersContent;
