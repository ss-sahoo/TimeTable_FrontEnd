import { useState, useEffect } from "react";
import { api } from "../../hooks/useApi";
import { useAuthContext } from "../../contexts/AuthContext";
import { toast } from "react-toastify";
import {
    UserPlus,
    Search,
    Filter,
    Edit2,
    Trash2,
    ChevronLeft,
    ChevronRight,
    X,
    AlertCircle,
    Download,
    FileSpreadsheet,
    Copy,
    Check,
    CheckCircle
} from "lucide-react";

interface UserData {
    id: string;
    username: string;
    first_name?: string;
    last_name?: string;
    email: string;
    role: string;
    institute_name?: string;
    center?: {
        id: string;
        name: string;
        city?: string;
    };
    center_name?: string;
    is_active: boolean;
}

interface NewUserData {
    username: string;
    email: string;
    password: string;
    password_confirm: string;
    first_name: string;
    last_name: string;
    role: string;
}

const AdminPeopleContent = () => {
    const { user: currentUser } = useAuthContext();
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<string>("all");
    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const [showAddUserModal, setShowAddUserModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [showCredentialsModal, setShowCredentialsModal] = useState(false);
    const [userCredentials, setUserCredentials] = useState<{ username: string; password: string } | null>(null);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importRole, setImportRole] = useState<string>("student");
    const [newUser, setNewUser] = useState<NewUserData>({
        username: "",
        email: "",
        password: "",
        password_confirm: "",
        first_name: "",
        last_name: "",
        role: "student"
    });
    const [error, setError] = useState<string>("");
    const [centerId, setCenterId] = useState<string | null>(null);
    const itemsPerPage = 10;

    // Get admin's center ID - with fallback to profile API
    useEffect(() => {
        const getCenterId = async () => {
            if (currentUser?.center_id) {
                setCenterId(currentUser.center_id);
            } else {
                // Fallback: fetch from profile API
                try {
                    const res = await api.get('/auth/profile/');
                    if (res.data?.center_id) {
                        setCenterId(res.data.center_id);
                    }
                } catch (err) {
                    console.error('Failed to fetch center from profile:', err);
                }
            }
        };
        getCenterId();
    }, [currentUser]);

    useEffect(() => {
        if (centerId) {
            fetchUsers();
        }
    }, [centerId]);

    const fetchUsers = async () => {
        if (!centerId) return;
        setLoading(true);
        try {
            const response = await api.get(`/auth/people/?center_id=${centerId}`);
            const data = response.data.users || response.data.results || response.data;
            // Filter to only include teacher, student, staff roles
            const filteredData = Array.isArray(data)
                ? data.filter((u: UserData) => ['teacher', 'student', 'staff'].includes(u.role.toLowerCase()))
                : [];
            setUsers(filteredData);
        } catch (error) {
            console.error("Error fetching users:", error);
            setError("Failed to fetch users");
        } finally {
            setLoading(false);
        }
    };

    const handleAddUser = async () => {
        if (!centerId) {
            setError("Center ID is required");
            return;
        }

        if (!newUser.first_name || !newUser.email) {
            setError("Please fill in name and email");
            return;
        }

        try {
            setError("");
            setLoading(true);

            const fullName = `${newUser.first_name} ${newUser.last_name}`.trim();
            let response;
            let endpoint = '';
            let useAutoGeneration = false;

            const roleLower = newUser.role.toLowerCase();

            switch (roleLower) {
                case 'teacher':
                    endpoint = '/timetable/superadmin/teachers/create/';
                    response = await api.post(endpoint, {
                        center_id: centerId,
                        name: fullName,
                        email: newUser.email,
                        phone_number: newUser.username || '',
                        employee_id: newUser.username || '',
                        subjects: 'General',
                    });
                    break;

                case 'staff':
                    endpoint = '/timetable/superadmin/staff/create/';
                    response = await api.post(endpoint, {
                        center_id: centerId,
                        name: fullName,
                        email: newUser.email,
                        phone_number: newUser.username || '',
                    });
                    break;

                case 'student':
                default:
                    // For students, use registration endpoint with auto-generated username
                    const autoUsername = newUser.username || `STU-${newUser.email.split('@')[0]}`;
                    const autoPassword = newUser.password || `Student@${new Date().getFullYear()}`;
                    const instituteId = currentUser?.institute_id || currentUser?.institute?.id;

                    response = await api.post('/auth/register/', {
                        username: autoUsername,
                        email: newUser.email,
                        password: autoPassword,
                        password_confirm: autoPassword,
                        first_name: newUser.first_name,
                        last_name: newUser.last_name,
                        role: 'student',
                        institute_id: instituteId
                    });

                    // Assign center after creation
                    if (response.data.id) {
                        try {
                            await api.post('/auth/assign-center/', {
                                user_id: response.data.id,
                                center_id: centerId
                            });
                        } catch (centerError) {
                            console.error('Failed to assign center:', centerError);
                        }
                    }

                    response.data = {
                        ...response.data,
                        username: autoUsername,
                        password: autoPassword
                    };
                    useAutoGeneration = true;
                    break;
            }

            setShowAddUserModal(false);
            setNewUser({
                username: "",
                email: "",
                password: "",
                password_confirm: "",
                first_name: "",
                last_name: "",
                role: "student"
            });
            setCurrentPage(1);
            await fetchUsers();

            if (useAutoGeneration && response?.data?.username && response?.data?.password) {
                setUserCredentials({
                    username: response.data.username,
                    password: response.data.password
                });
                setShowCredentialsModal(true);
            } else {
                toast.error("User added successfully!");
            }
        } catch (error: any) {
            console.error("Error adding user:", error);
            const errorMessage = error.response?.data?.detail ||
                error.response?.data?.message ||
                error.response?.data?.error ||
                JSON.stringify(error.response?.data) ||
                "Failed to add user";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm("Are you sure you want to delete this user?")) return;

        try {
            await api.delete(`/auth/users/${userId}/`);
            fetchUsers();
        } catch (error) {
            console.error("Error deleting user:", error);
            setError("Failed to delete user");
        }
    };

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedField(field);
            setTimeout(() => setCopiedField(null), 2000);
        });
    };

    const handleCloseCredentials = () => {
        setShowCredentialsModal(false);
        setUserCredentials(null);
        setCopiedField(null);
        fetchUsers();
    };

    const handleExport = () => {
        const csv = [
            ["Username", "Email", "Role", "Status"],
            ...users.map(u => [
                u.username,
                u.email,
                u.role,
                u.is_active ? "Active" : "Inactive"
            ])
        ].map(row => row.join(",")).join("\n");

        const blob = new Blob([csv], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const downloadTemplate = () => {
        let template: string[][];

        switch (importRole) {
            case 'teacher':
                template = [
                    ["name", "email", "phone_number", "employee_id", "subjects"],
                    ["John Doe", "john.doe@example.com", "9876543210", "EMP-001", "Physics, Chemistry"],
                    ["Jane Smith", "jane.smith@example.com", "9876543211", "EMP-002", "Mathematics"],
                ];
                break;
            case 'student':
                template = [
                    ["name", "email", "phone_number", "batch_code", "date_of_birth"],
                    ["Alice Johnson", "alice@example.com", "9876543212", "BATCH-2024-A", "2005-01-15"],
                    ["Bob Williams", "bob@example.com", "9876543213", "BATCH-2024-A", "2005-03-20"],
                ];
                break;
            case 'staff':
                template = [
                    ["name", "email", "phone_number"],
                    ["Mike Brown", "mike@example.com", "9876543214"],
                    ["Sarah Davis", "sarah@example.com", "9876543215"],
                ];
                break;
            default:
                template = [
                    ["name", "email", "phone_number"],
                    ["Example User", "user@example.com", "9876543210"],
                ];
        }

        const csv = template.map(row => row.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${importRole}-import-template.csv`;
        a.click();
    };

    const handleImportUsers = async () => {
        if (!importFile) {
            setError("Please select a file to import");
            return;
        }

        if (!centerId) {
            setError("Center ID is required");
            return;
        }

        try {
            setError("");
            setLoading(true);

            const formData = new FormData();
            formData.append('file', importFile);
            formData.append('center_id', centerId);

            let endpoint = '';
            switch (importRole) {
                case 'teacher':
                    endpoint = '/timetable/superadmin/teachers/bulk_create/';
                    break;
                case 'student':
                    endpoint = '/timetable/superadmin/students/bulk_create/';
                    break;
                case 'staff':
                    endpoint = '/timetable/superadmin/staff/bulk_create/';
                    break;
                default:
                    setError("Please select a valid role");
                    setLoading(false);
                    return;
            }

            const response = await api.post(endpoint, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setShowImportModal(false);
            setImportFile(null);
            setImportRole('student');

            const successCount = response.data.success || response.data.created_count || 0;
            const totalCount = response.data.total || 0;
            toast.error(`Successfully imported ${successCount} out of ${totalCount} users!`);

            fetchUsers();
        } catch (error: any) {
            console.error("Error importing users:", error);
            setError(error.response?.data?.detail || error.response?.data?.message || error.response?.data?.error || "Failed to import users");
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (user.first_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (user.last_name?.toLowerCase().includes(searchQuery.toLowerCase()));

        if (activeTab === "all") return matchesSearch;
        return matchesSearch && user.role.toLowerCase() === activeTab.toLowerCase();
    });

    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const paginatedUsers = filteredUsers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const getRoleCounts = () => {
        return {
            all: users.length,
            student: users.filter(u => u.role.toLowerCase() === 'student').length,
            teacher: users.filter(u => u.role.toLowerCase() === 'teacher').length,
            staff: users.filter(u => u.role.toLowerCase() === 'staff').length,
        };
    };

    const roleCounts = getRoleCounts();

    const getRoleBadgeStyle = (role: string) => {
        const roleLower = role.toLowerCase();
        switch (roleLower) {
            case 'staff':
                return 'bg-gray-50 text-gray-600 ring-gray-500/10';
            case 'student':
                return 'bg-yellow-50 text-yellow-800 ring-yellow-600/20';
            case 'teacher':
                return 'bg-green-50 text-green-700 ring-green-600/20';
            default:
                return 'bg-gray-50 text-gray-600 ring-gray-500/10';
        }
    };

    const getRoleDisplayName = (role: string) => {
        return role.replace('_', ' ').split(' ').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    const getInitials = (user: UserData) => {
        if (user.first_name && user.last_name) {
            return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
        }
        return user.username.substring(0, 2).toUpperCase();
    };

    const getAvatarColor = (role: string) => {
        const roleLower = role.toLowerCase();
        switch (roleLower) {
            case 'staff':
                return 'bg-gray-100 text-gray-600';
            case 'student':
                return 'bg-green-100 text-green-600';
            case 'teacher':
                return 'bg-indigo-100 text-indigo-600';
            default:
                return 'bg-gray-100 text-gray-600';
        }
    };

    const toggleSelectAll = () => {
        if (selectedUsers.size === paginatedUsers.length) {
            setSelectedUsers(new Set());
        } else {
            setSelectedUsers(new Set(paginatedUsers.map(u => u.id)));
        }
    };

    const toggleSelectUser = (userId: string) => {
        const newSelected = new Set(selectedUsers);
        if (newSelected.has(userId)) {
            newSelected.delete(userId);
        } else {
            newSelected.add(userId);
        }
        setSelectedUsers(newSelected);
    };

    return (
        <div className="w-full h-full">
            {/* Page Header */}
            <div className="md:flex md:items-center md:justify-between mb-6">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                        People Management
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Manage teachers, students, and staff in your center.
                    </p>
                </div>
                <div className="mt-4 flex md:ml-4 md:mt-0 gap-3">
                    <button
                        type="button"
                        onClick={handleExport}
                        className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    >
                        <Download className="-ml-0.5 mr-1.5 h-5 w-5 text-gray-400" />
                        Export
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowImportModal(true)}
                        className="inline-flex items-center rounded-md bg-purple-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-500"
                    >
                        <FileSpreadsheet className="-ml-0.5 mr-1.5 h-5 w-5" />
                        Import Excel
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowAddUserModal(true)}
                        className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    >
                        <UserPlus className="-ml-0.5 mr-1.5 h-5 w-5" />
                        Add User
                    </button>
                </div>
            </div>

            {/* Main Content Card */}
            <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl overflow-hidden">
                {/* Tabs - Only Teacher, Student, Staff */}
                <div className="border-b border-gray-200">
                    <div className="sm:flex sm:items-baseline">
                        <div className="px-4 sm:px-6 pt-4">
                            <nav className="-mb-px flex space-x-6">
                                <button
                                    onClick={() => setActiveTab("all")}
                                    className={`${activeTab === "all"
                                        ? "border-blue-500 text-blue-600"
                                        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                                        } whitespace-nowrap border-b-2 pb-4 px-1 text-sm font-medium`}
                                >
                                    All Users
                                    <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${activeTab === "all" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
                                        }`}>
                                        {roleCounts.all}
                                    </span>
                                </button>
                                <button
                                    onClick={() => setActiveTab("teacher")}
                                    className={`${activeTab === "teacher"
                                        ? "border-blue-500 text-blue-600"
                                        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                                        } whitespace-nowrap border-b-2 pb-4 px-1 text-sm font-medium`}
                                >
                                    Teachers
                                    <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${activeTab === "teacher" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
                                        }`}>
                                        {roleCounts.teacher || 0}
                                    </span>
                                </button>
                                <button
                                    onClick={() => setActiveTab("student")}
                                    className={`${activeTab === "student"
                                        ? "border-blue-500 text-blue-600"
                                        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                                        } whitespace-nowrap border-b-2 pb-4 px-1 text-sm font-medium`}
                                >
                                    Students
                                    <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${activeTab === "student" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
                                        }`}>
                                        {roleCounts.student || 0}
                                    </span>
                                </button>
                                <button
                                    onClick={() => setActiveTab("staff")}
                                    className={`${activeTab === "staff"
                                        ? "border-blue-500 text-blue-600"
                                        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                                        } whitespace-nowrap border-b-2 pb-4 px-1 text-sm font-medium`}
                                >
                                    Staff
                                    <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${activeTab === "staff" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
                                        }`}>
                                        {roleCounts.staff || 0}
                                    </span>
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>

                {/* Filters Bar */}
                <div className="p-4 sm:p-6 bg-gray-50/50 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full sm:w-96">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full rounded-md border-0 py-2 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                            placeholder="Search by name, email..."
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            className="inline-flex items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                        >
                            <Filter className="-ml-0.5 h-5 w-5 text-gray-400" />
                            Filters
                        </button>
                    </div>
                </div>

                {/* Table */}
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 sm:pl-6">
                                        <input
                                            type="checkbox"
                                            checked={selectedUsers.size === paginatedUsers.length && paginatedUsers.length > 0}
                                            onChange={toggleSelectAll}
                                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                                        />
                                    </th>
                                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                                        User Details
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                                        Role
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                                        Status
                                    </th>
                                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {paginatedUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center">
                                            <p className="text-sm text-gray-500">No users found</p>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedUsers.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50">
                                            <td className="pl-4 pr-3 sm:pl-6">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedUsers.has(user.id)}
                                                    onChange={() => toggleSelectUser(user.id)}
                                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                                                />
                                            </td>
                                            <td className="whitespace-nowrap py-4 pl-4 pr-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${getAvatarColor(user.role)}`}>
                                                        {getInitials(user)}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-900">
                                                            {user.first_name && user.last_name
                                                                ? `${user.first_name} ${user.last_name}`
                                                                : user.username}
                                                        </div>
                                                        <div className="text-sm text-gray-500">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4">
                                                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getRoleBadgeStyle(user.role)}`}>
                                                    {getRoleDisplayName(user.role)}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4">
                                                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${user.is_active
                                                    ? "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20"
                                                    : "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20"
                                                    }`}>
                                                    {user.is_active ? "Active" : "Inactive"}
                                                </span>
                                            </td>
                                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button className="text-gray-400 hover:text-blue-600 transition-colors">
                                                        <Edit2 className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUser(user.id)}
                                                        className="text-gray-400 hover:text-red-600 transition-colors"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                        <div className="flex flex-1 justify-between sm:hidden">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Next
                            </button>
                        </div>
                        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                                    <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> of{' '}
                                    <span className="font-medium">{filteredUsers.length}</span> results
                                </p>
                            </div>
                            <div>
                                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                                    >
                                        <ChevronLeft className="h-5 w-5" />
                                    </button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).slice(
                                        Math.max(0, currentPage - 3),
                                        Math.min(totalPages, currentPage + 2)
                                    ).map((page) => (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${page === currentPage
                                                ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                                                : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                                    >
                                        <ChevronRight className="h-5 w-5" />
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Add User Modal */}
            {showAddUserModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowAddUserModal(false)} />
                        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                            <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">Add New User</h3>
                                    <button onClick={() => setShowAddUserModal(false)} className="text-gray-400 hover:text-gray-500">
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                {error && (
                                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                                        <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-red-600">{error}</p>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                                            <input
                                                type="text"
                                                value={newUser.first_name}
                                                onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })}
                                                className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
                                                placeholder="John"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                            <input
                                                type="text"
                                                value={newUser.last_name}
                                                onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })}
                                                className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
                                                placeholder="Doe"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                        <input
                                            type="email"
                                            value={newUser.email}
                                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                            className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
                                            placeholder="john.doe@example.com"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone / Employee ID</label>
                                        <input
                                            type="text"
                                            value={newUser.username}
                                            onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                                            className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
                                            placeholder="9876543210"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                                        <select
                                            value={newUser.role}
                                            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                            className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
                                        >
                                            <option value="student">Student</option>
                                            <option value="teacher">Teacher</option>
                                            <option value="staff">Staff</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 gap-3">
                                <button
                                    type="button"
                                    onClick={handleAddUser}
                                    disabled={loading}
                                    className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto disabled:opacity-50"
                                >
                                    {loading ? "Adding..." : "Add User"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowAddUserModal(false)}
                                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Import Modal */}
            {showImportModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowImportModal(false)} />
                        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                            <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">Import Users from Excel</h3>
                                    <button onClick={() => setShowImportModal(false)} className="text-gray-400 hover:text-gray-500">
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                {error && (
                                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                                        <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-red-600">{error}</p>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">User Type</label>
                                        <select
                                            value={importRole}
                                            onChange={(e) => setImportRole(e.target.value)}
                                            className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
                                        >
                                            <option value="student">Students</option>
                                            <option value="teacher">Teachers</option>
                                            <option value="staff">Staff</option>
                                        </select>
                                    </div>

                                    <div>
                                        <button
                                            type="button"
                                            onClick={downloadTemplate}
                                            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-500"
                                        >
                                            <Download className="h-4 w-4" />
                                            Download Template for {importRole.charAt(0).toUpperCase() + importRole.slice(1)}s
                                        </button>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Select File</label>
                                        <input
                                            type="file"
                                            accept=".csv,.xlsx,.xls"
                                            onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 gap-3">
                                <button
                                    type="button"
                                    onClick={handleImportUsers}
                                    disabled={loading || !importFile}
                                    className="inline-flex w-full justify-center rounded-md bg-purple-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-500 sm:ml-3 sm:w-auto disabled:opacity-50"
                                >
                                    {loading ? "Importing..." : "Import Users"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowImportModal(false)}
                                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Credentials Modal */}
            {showCredentialsModal && userCredentials && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
                        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md">
                            <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                                        <CheckCircle className="h-6 w-6 text-green-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">User Created Successfully</h3>
                                        <p className="text-sm text-gray-500">Please save these credentials securely</p>
                                    </div>
                                </div>

                                <div className="space-y-4 mt-6">
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm text-gray-500">Username</span>
                                            <button
                                                onClick={() => copyToClipboard(userCredentials.username, 'username')}
                                                className="flex items-center gap-1 text-blue-600 hover:text-blue-500"
                                            >
                                                {copiedField === 'username' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                                <span className="text-xs">{copiedField === 'username' ? 'Copied!' : 'Copy'}</span>
                                            </button>
                                        </div>
                                        <p className="font-mono text-sm bg-white rounded px-3 py-2 border">{userCredentials.username}</p>
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm text-gray-500">Password</span>
                                            <button
                                                onClick={() => copyToClipboard(userCredentials.password, 'password')}
                                                className="flex items-center gap-1 text-blue-600 hover:text-blue-500"
                                            >
                                                {copiedField === 'password' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                                <span className="text-xs">{copiedField === 'password' ? 'Copied!' : 'Copy'}</span>
                                            </button>
                                        </div>
                                        <p className="font-mono text-sm bg-white rounded px-3 py-2 border">{userCredentials.password}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                                <button
                                    type="button"
                                    onClick={handleCloseCredentials}
                                    className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:w-auto"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPeopleContent;
