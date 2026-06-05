import { useState, useEffect, useRef } from "react";
import { api } from "../hooks/useApi";
import { useAuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Building2, Users, UserPlus, GraduationCap, BookOpen, Shield,
  Plus, Edit, Trash2, Copy, Check,
  X, AlertCircle, CheckCircle, Loader2,
  LayoutDashboard, Settings, LogOut, Menu, RefreshCw,
  Upload, FileSpreadsheet, Download
} from "lucide-react";

interface Institute {
  id: number;
  name: string;
  domain?: string;
  is_active: boolean;
  user_count?: number;
}

interface Center {
  id: string;
  name: string;
  city: string;
  institute: { id: number; name: string };
}

interface UserData {
  id: string | number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
  is_active: boolean;
  center_name?: string;
  institute_name?: string;
}

interface CreatedUser {
  username: string;
  password: string;
  role: string;
  center?: string;
  batch?: string;
}

interface BulkUploadResult {
  total: number;
  success: number;
  failed: number;
  created_users?: Array<{ username: string; password: string }>;
  errors?: string[];
}

type TabType = "dashboard" | "institutes" | "centers" | "users" | "all-users" | "bulk-upload" | "settings";

export default function ManagerDashboard() {
  const { user, logout, isAuthenticated, loading: authLoading } = useAuthContext();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Data states
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal states
  const [showCreateInstitute, setShowCreateInstitute] = useState(false);
  const [showCreateCenter, setShowCreateCenter] = useState(false);
  const [createdUser, setCreatedUser] = useState<CreatedUser | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: string; id: string | number; name: string } | null>(null);

  // Form states
  const [instituteForm, setInstituteForm] = useState({ name: "", domain: "", description: "" });
  const [centerForm, setCenterForm] = useState({ institute_id: "", name: "", city: "", address: "" });
  const [userForm, setUserForm] = useState({
    role: "ADMIN",
    center_id: "",
    batch_code: "",
    name: "",
    email: "",
    phone_number: "",
    subjects: ""
  });

  // Bulk upload states
  const [bulkUploadRole, setBulkUploadRole] = useState<string>("teacher");
  const [bulkUploadCenterId, setBulkUploadCenterId] = useState<string>("");
  const [bulkUploadBatchCode, setBulkUploadBatchCode] = useState<string>("");
  const [bulkUploadFile, setBulkUploadFile] = useState<File | null>(null);
  const [bulkUploadResult, setBulkUploadResult] = useState<BulkUploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check authentication
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login", { replace: true });
    }
    const userRole = user?.role as string;
    if (!authLoading && userRole !== "manager" && userRole !== "super_admin" && userRole !== "SUPER_ADMIN") {
      navigate("/dashboard", { replace: true });
    }
  }, [user, isAuthenticated, authLoading, navigate]);

  // Fetch data
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchInstitutes();
      fetchCenters();
      fetchAllUsers();
    }
  }, [isAuthenticated, user]);

  const fetchInstitutes = async () => {
    try {
      const response = await api.get("/auth/institutes/");
      const data = response.data;
      if (Array.isArray(data)) setInstitutes(data);
      else if (data?.results) setInstitutes(data.results);
      else setInstitutes([]);
    } catch (err) {
      console.error("Error fetching institutes:", err);
      setInstitutes([]);
    }
  };

  const fetchCenters = async () => {
    try {
      const response = await api.get("/timetable/centers/");
      const data = response.data;
      if (Array.isArray(data)) setCenters(data);
      else if (data?.centers) setCenters(data.centers);
      else if (data?.results) setCenters(data.results);
      else setCenters([]);
    } catch (err) {
      console.error("Error fetching centers:", err);
      setCenters([]);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const response = await api.get("/auth/people/");
      const data = response.data;
      if (data?.users) setAllUsers(data.users);
      else if (Array.isArray(data)) setAllUsers(data);
      else if (data?.results) setAllUsers(data.results);
      else setAllUsers([]);
    } catch (err) {
      console.error("Error fetching users:", err);
      setAllUsers([]);
    }
  };

  // Create Institute
  const handleCreateInstitute = async () => {
    if (!instituteForm.name) { setError("Institute name is required"); return; }
    setLoading(true); setError(null);
    try {
      await api.post("/auth/institutes/", instituteForm);
      setSuccess("Institute created successfully!");
      setShowCreateInstitute(false);
      setInstituteForm({ name: "", domain: "", description: "" });
      fetchInstitutes();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create institute");
    } finally { setLoading(false); }
  };

  // Create Center
  const handleCreateCenter = async () => {
    if (!centerForm.institute_id || !centerForm.name || !centerForm.city) {
      setError("Institute, name, and city are required"); return;
    }
    setLoading(true); setError(null);
    try {
      await api.post("/timetable/superadmin/centers/create/", centerForm);
      setSuccess("Center created successfully!");
      setShowCreateCenter(false);
      setCenterForm({ institute_id: "", name: "", city: "", address: "" });
      fetchCenters();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create center");
    } finally { setLoading(false); }
  };

  // Create User
  const handleCreateUser = async () => {
    if (!userForm.name) { setError("Name is required"); return; }
    setLoading(true); setError(null);
    try {
      let endpoint = "";
      const payload: any = { name: userForm.name, email: userForm.email, phone_number: userForm.phone_number };

      switch (userForm.role) {
        case "ADMIN": endpoint = "/timetable/superadmin/admins/create/"; payload.center_id = userForm.center_id; break;
        case "teacher": endpoint = "/timetable/superadmin/teachers/create/"; payload.center_id = userForm.center_id; payload.subjects = userForm.subjects; break;
        case "student": endpoint = "/timetable/superadmin/students/create/"; payload.batch_code = userForm.batch_code; break;
        case "STAFF": endpoint = "/timetable/superadmin/staff/create/"; payload.center_id = userForm.center_id; break;
      }

      const response = await api.post(endpoint, payload);
      setCreatedUser({ username: response.data.username, password: response.data.password, role: userForm.role, center: response.data.center, batch: response.data.batch });
      setSuccess("User created successfully!");
      setUserForm({ role: "ADMIN", center_id: "", batch_code: "", name: "", email: "", phone_number: "", subjects: "" });
      fetchAllUsers();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create user");
    } finally { setLoading(false); }
  };

  // Delete handlers
  const handleDeleteCenter = async (centerId: string) => {
    setLoading(true); setError(null);
    try {
      await api.delete(`/timetable/superadmin/centers/${centerId}/delete/`);
      setSuccess("Center deleted successfully!");
      setDeleteConfirm(null);
      fetchCenters();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to delete center");
    } finally { setLoading(false); }
  };

  const handleDeleteUser = async (userId: string | number) => {
    setLoading(true); setError(null);
    try {
      await api.delete(`/auth/users/${userId}/`);
      setSuccess("User deleted successfully!");
      setDeleteConfirm(null);
      fetchAllUsers();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to delete user");
    } finally { setLoading(false); }
  };

  // Bulk Upload Handler
  const handleBulkUpload = async () => {
    if (!bulkUploadFile) { setError("Please select a file"); return; }
    if (bulkUploadRole !== "student" && !bulkUploadCenterId) { setError("Please select a center"); return; }
    if (bulkUploadRole === "student" && !bulkUploadBatchCode) { setError("Please enter batch code"); return; }

    setLoading(true); setError(null); setBulkUploadResult(null);

    const formData = new FormData();
    formData.append("file", bulkUploadFile);
    if (bulkUploadRole !== "student") {
      formData.append("center_id", bulkUploadCenterId);
    } else {
      formData.append("batch_code", bulkUploadBatchCode);
    }

    let endpoint = "";
    switch (bulkUploadRole) {
      case "teacher": endpoint = "/timetable/superadmin/teachers/bulk_create/"; break;
      case "student": endpoint = "/timetable/superadmin/students/bulk_create/"; break;
      case "STAFF": endpoint = "/timetable/superadmin/staff/bulk_create/"; break;
      default: setError("Bulk upload not supported for this role"); setLoading(false); return;
    }

    try {
      const response = await api.post(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setBulkUploadResult({
        total: response.data.total || 0,
        success: response.data.success || 0,
        failed: response.data.failed || 0,
        created_users: response.data.created_teachers || response.data.created_students || response.data.created_staff || [],
        errors: response.data.errors || []
      });
      setSuccess(`Bulk upload completed! ${response.data.success || 0} users created.`);
      setBulkUploadFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchAllUsers();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Bulk upload failed");
    } finally { setLoading(false); }
  };

  const downloadTemplate = (role: string) => {
    let csvContent = "";
    switch (role) {
      case "teacher":
        csvContent = "name,email,phone_number,employee_id,subjects\nJohn Doe,john@example.com,9876543210,EMP-001,Physics\nJane Smith,jane@example.com,9876543211,EMP-002,Chemistry";
        break;
      case "student":
        csvContent = "name,email,phone_number,date_of_birth\nStudent One,student1@example.com,9876543210,2005-01-15\nStudent Two,student2@example.com,9876543211,2005-03-20";
        break;
      case "STAFF":
        csvContent = "name,email,phone_number\nStaff One,staff1@example.com,9876543210\nStaff Two,staff2@example.com,9876543211";
        break;
    }
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${role}_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleLogout = () => { logout(); navigate("/login"); };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      super_admin: "bg-red-100 text-red-700", SUPER_ADMIN: "bg-red-100 text-red-700",
      manager: "bg-purple-100 text-purple-700",
      institute_admin: "bg-blue-100 text-blue-700", ADMIN: "bg-blue-100 text-blue-700",
      teacher: "bg-emerald-100 text-emerald-700", TEACHER: "bg-emerald-100 text-emerald-700",
      student: "bg-amber-100 text-amber-700", STUDENT: "bg-amber-100 text-amber-700",
      STAFF: "bg-slate-100 text-slate-700",
    };
    return colors[role] || "bg-slate-100 text-slate-700";
  };

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-950"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>;
  }

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "institutes", label: "Institutes", icon: Building2 },
    { id: "centers", label: "Centers", icon: Building2 },
    { id: "all-users", label: "All Users", icon: Users },
    { id: "users", label: "Create Users", icon: UserPlus },
    { id: "bulk-upload", label: "Bulk Upload", icon: Upload },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-64" : "w-20"} bg-white dark:bg-gray-900 border-r border-slate-200 dark:border-gray-800 transition-all duration-300 flex flex-col`}>
        <div className="p-4 border-b border-slate-200 dark:border-gray-800 flex items-center justify-between">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-slate-900 dark:text-white">Manager</span>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-lg">
            <Menu className="w-5 h-5 text-slate-600 dark:text-gray-400" />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id as TabType)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600" : "text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-800"}`}>
              <item.icon className="w-5 h-5" />
              {sidebarOpen && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-200 dark:border-gray-800">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl">
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{navItems.find(n => n.id === activeTab)?.label}</h1>
          <div className="flex items-center gap-4">
            <button onClick={() => { fetchInstitutes(); fetchCenters(); fetchAllUsers(); }} className="p-2 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-lg">
              <RefreshCw className="w-5 h-5 text-slate-600 dark:text-gray-400" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold">{user?.username?.charAt(0).toUpperCase()}</span>
              </div>
              <span className="font-medium text-slate-900 dark:text-white">{user?.username}</span>
            </div>
          </div>
        </header>

        {/* Alerts */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-700 dark:text-red-400">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
          </div>
        )}
        {success && (
          <div className="mx-6 mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-700 dark:text-green-400">{success}</span>
            <button onClick={() => setSuccess(null)} className="ml-auto"><X className="w-4 h-4" /></button>
          </div>
        )}

        <div className="p-6">

          {/* Dashboard Tab */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-slate-200 dark:border-gray-800">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center"><Building2 className="w-6 h-6 text-blue-600" /></div>
                    <div><p className="text-sm text-slate-500">Institutes</p><p className="text-2xl font-bold text-slate-900 dark:text-white">{institutes.length}</p></div>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-slate-200 dark:border-gray-800">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center"><Building2 className="w-6 h-6 text-emerald-600" /></div>
                    <div><p className="text-sm text-slate-500">Centers</p><p className="text-2xl font-bold text-slate-900 dark:text-white">{centers.length}</p></div>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-slate-200 dark:border-gray-800">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center"><Users className="w-6 h-6 text-purple-600" /></div>
                    <div><p className="text-sm text-slate-500">Total Users</p><p className="text-2xl font-bold text-slate-900 dark:text-white">{allUsers.length}</p></div>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-slate-200 dark:border-gray-800">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center"><BookOpen className="w-6 h-6 text-amber-600" /></div>
                    <div><p className="text-sm text-slate-500">Active</p><p className="text-2xl font-bold text-slate-900 dark:text-white">{allUsers.filter(u => u.is_active).length}</p></div>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-slate-200 dark:border-gray-800">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button onClick={() => setShowCreateInstitute(true)} className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl hover:bg-blue-100 transition-all text-center">
                    <Building2 className="w-8 h-8 text-blue-600 mx-auto mb-2" /><span className="text-sm font-medium text-slate-700 dark:text-gray-300">Create Institute</span>
                  </button>
                  <button onClick={() => setShowCreateCenter(true)} className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl hover:bg-emerald-100 transition-all text-center">
                    <Building2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" /><span className="text-sm font-medium text-slate-700 dark:text-gray-300">Create Center</span>
                  </button>
                  <button onClick={() => setActiveTab("users")} className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl hover:bg-purple-100 transition-all text-center">
                    <UserPlus className="w-8 h-8 text-purple-600 mx-auto mb-2" /><span className="text-sm font-medium text-slate-700 dark:text-gray-300">Create User</span>
                  </button>
                  <button onClick={() => setActiveTab("all-users")} className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl hover:bg-amber-100 transition-all text-center">
                    <Users className="w-8 h-8 text-amber-600 mx-auto mb-2" /><span className="text-sm font-medium text-slate-700 dark:text-gray-300">View All Users</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Institutes Tab */}
          {activeTab === "institutes" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <p className="text-slate-500">Manage all institutes</p>
                <button onClick={() => setShowCreateInstitute(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"><Plus className="w-4 h-4" /> Create Institute</button>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Name</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Domain</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
                    {institutes.map((inst) => (
                      <tr key={inst.id} className="hover:bg-slate-50 dark:hover:bg-gray-800/50">
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{inst.name}</td>
                        <td className="px-6 py-4 text-slate-500">{inst.domain || "-"}</td>
                        <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${inst.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{inst.is_active ? "Active" : "Inactive"}</span></td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => navigate(`/institute-profile/${inst.id}`)}
                            className="p-2 hover:bg-slate-100 rounded-lg"
                          >
                            <Edit className="w-4 h-4 text-slate-500" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {institutes.length === 0 && <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500">No institutes found</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Centers Tab */}
          {activeTab === "centers" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <p className="text-slate-500">Manage all centers</p>
                <button onClick={() => setShowCreateCenter(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"><Plus className="w-4 h-4" /> Create Center</button>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Name</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">City</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Institute</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
                    {centers.map((center) => (
                      <tr key={center.id} className="hover:bg-slate-50 dark:hover:bg-gray-800/50">
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{center.name}</td>
                        <td className="px-6 py-4 text-slate-500">{center.city}</td>
                        <td className="px-6 py-4 text-slate-500">{center.institute?.name || "-"}</td>
                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                          <button className="p-2 hover:bg-slate-100 rounded-lg"><Edit className="w-4 h-4 text-slate-500" /></button>
                          <button onClick={() => setDeleteConfirm({ type: "center", id: center.id, name: center.name })} className="p-2 hover:bg-red-100 rounded-lg"><Trash2 className="w-4 h-4 text-red-500" /></button>
                        </td>
                      </tr>
                    ))}
                    {centers.length === 0 && <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500">No centers found</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* All Users Tab */}
          {activeTab === "all-users" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <p className="text-slate-500">All users in the system ({allUsers.length})</p>
                <button onClick={() => setActiveTab("users")} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"><UserPlus className="w-4 h-4" /> Create User</button>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-4 text-left text-xs font-bold text-slate-500 uppercase">User Info</th>
                        <th className="px-4 py-4 text-left text-xs font-bold text-slate-500 uppercase">Login Code</th>
                        <th className="px-4 py-4 text-left text-xs font-bold text-slate-500 uppercase">Email</th>
                        <th className="px-4 py-4 text-left text-xs font-bold text-slate-500 uppercase">Role</th>
                        <th className="px-4 py-4 text-left text-xs font-bold text-slate-500 uppercase">Center</th>
                        <th className="px-4 py-4 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
                        <th className="px-4 py-4 text-right text-xs font-bold text-slate-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
                      {allUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-gray-800/50">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-slate-100 dark:bg-gray-700 rounded-full flex items-center justify-center font-bold text-slate-600">{u.username?.charAt(0).toUpperCase()}</div>
                              <div>
                                <p className="font-medium text-slate-900 dark:text-white">{u.first_name || ''} {u.last_name || ''}</p>
                                <p className="text-xs text-slate-500">ID: {u.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <code className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded font-mono text-sm font-bold">{u.username}</code>
                              <button onClick={() => copyToClipboard(u.username, `code-${u.id}`)} className="p-1 hover:bg-slate-100 rounded">
                                {copiedField === `code-${u.id}` ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-slate-500 text-sm">{u.email || '-'}</td>
                          <td className="px-4 py-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadge(u.role)}`}>{u.role}</span></td>
                          <td className="px-4 py-4 text-slate-500 text-sm">{u.center_name || u.institute_name || '-'}</td>
                          <td className="px-4 py-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${u.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{u.is_active ? "Active" : "Inactive"}</span></td>
                          <td className="px-4 py-4 text-right">
                            <div className="flex justify-end gap-1">
                              <button className="p-2 hover:bg-slate-100 rounded-lg" title="Edit"><Edit className="w-4 h-4 text-slate-500" /></button>
                              <button onClick={() => setDeleteConfirm({ type: "user", id: u.id, name: u.username })} className="p-2 hover:bg-red-100 rounded-lg" title="Delete"><Trash2 className="w-4 h-4 text-red-500" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {allUsers.length === 0 && <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-500">No users found</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Create Users Tab */}
          {activeTab === "users" && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 p-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Create New User</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {[
                    { role: "ADMIN", label: "Admin", icon: Shield, bg: "bg-purple-50", color: "text-purple-600" },
                    { role: "teacher", label: "Teacher", icon: GraduationCap, bg: "bg-blue-50", color: "text-blue-600" },
                    { role: "student", label: "Student", icon: Users, bg: "bg-emerald-50", color: "text-emerald-600" },
                    { role: "STAFF", label: "Staff", icon: Users, bg: "bg-amber-50", color: "text-amber-600" },
                  ].map((item) => (
                    <button key={item.role} onClick={() => setUserForm({ ...userForm, role: item.role })}
                      className={`p-4 rounded-xl border-2 transition-all ${userForm.role === item.role ? `border-blue-500 ${item.bg}` : "border-slate-200 hover:border-slate-300"}`}>
                      <item.icon className={`w-8 h-8 mx-auto mb-2 ${userForm.role === item.role ? item.color : "text-slate-400"}`} />
                      <span className={`text-sm font-medium ${userForm.role === item.role ? item.color : "text-slate-600"}`}>{item.label}</span>
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Full Name *</label>
                    <input type="text" value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Enter full name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Email</label>
                    <input type="email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Enter email (optional)" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Phone Number</label>
                    <input type="text" value={userForm.phone_number} onChange={(e) => setUserForm({ ...userForm, phone_number: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Enter phone number" />
                  </div>
                  {userForm.role !== "student" && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Center *</label>
                      <select value={userForm.center_id} onChange={(e) => setUserForm({ ...userForm, center_id: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                        <option value="">Select Center</option>
                        {centers.map((center) => (<option key={center.id} value={center.id}>{center.name} ({center.city})</option>))}
                      </select>
                    </div>
                  )}
                  {userForm.role === "student" && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Batch Code *</label>
                      <input type="text" value={userForm.batch_code} onChange={(e) => setUserForm({ ...userForm, batch_code: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g., JEE-2026-A" />
                    </div>
                  )}
                  {userForm.role === "teacher" && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Subjects</label>
                      <input type="text" value={userForm.subjects} onChange={(e) => setUserForm({ ...userForm, subjects: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g., Physics, Mathematics" />
                    </div>
                  )}
                </div>
                <button onClick={handleCreateUser} disabled={loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                  Create {userForm.role === "ADMIN" ? "Admin" : userForm.role === "teacher" ? "Teacher" : userForm.role === "student" ? "Student" : "Staff"}
                </button>
              </div>

              {/* Created User Credentials */}
              {createdUser && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-200 dark:border-green-800 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <h3 className="text-lg font-bold text-green-800 dark:text-green-400">User Created!</h3>
                  </div>
                  <p className="text-sm text-green-700 mb-4">Save these credentials - password cannot be recovered.</p>
                  <div className="bg-white dark:bg-gray-900 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div><p className="text-xs text-slate-500 uppercase">Login Code</p><p className="text-lg font-mono font-bold text-slate-900 dark:text-white">{createdUser.username}</p></div>
                      <button onClick={() => copyToClipboard(createdUser.username, "username")} className="p-2 hover:bg-slate-100 rounded-lg">
                        {copiedField === "username" ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5 text-slate-400" />}
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div><p className="text-xs text-slate-500 uppercase">Password</p><p className="text-lg font-mono font-bold text-slate-900 dark:text-white">{createdUser.password}</p></div>
                      <button onClick={() => copyToClipboard(createdUser.password, "password")} className="p-2 hover:bg-slate-100 rounded-lg">
                        {copiedField === "password" ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5 text-slate-400" />}
                      </button>
                    </div>
                    <div className="pt-2 border-t"><p className="text-xs text-slate-500"><span className="font-medium">Role:</span> {createdUser.role} | <span className="font-medium">Location:</span> {createdUser.center || createdUser.batch || "-"}</p></div>
                  </div>
                  <button onClick={() => setCreatedUser(null)} className="mt-4 px-4 py-2 text-sm text-green-700 hover:bg-green-100 rounded-lg">Create Another</button>
                </div>
              )}
            </div>
          )}

          {/* Bulk Upload Tab */}
          {activeTab === "bulk-upload" && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 p-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Bulk Upload Users</h3>
                <p className="text-slate-500 mb-6">Upload Excel (.xlsx) or CSV files to create multiple users at once.</p>

                {/* Role Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-3">Select Role</label>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { role: "teacher", label: "Teachers", icon: GraduationCap, color: "blue" },
                      { role: "student", label: "Students", icon: Users, color: "emerald" },
                      { role: "STAFF", label: "Staff", icon: Users, color: "amber" },
                    ].map((item) => (
                      <button key={item.role} onClick={() => setBulkUploadRole(item.role)}
                        className={`p-4 rounded-xl border-2 transition-all ${bulkUploadRole === item.role ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-slate-200 dark:border-gray-700 hover:border-slate-300"}`}>
                        <item.icon className={`w-8 h-8 mx-auto mb-2 ${bulkUploadRole === item.role ? "text-blue-600" : "text-slate-400"}`} />
                        <span className={`text-sm font-medium ${bulkUploadRole === item.role ? "text-blue-700" : "text-slate-600"}`}>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Center/Batch Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {bulkUploadRole !== "student" ? (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Center *</label>
                      <select value={bulkUploadCenterId} onChange={(e) => setBulkUploadCenterId(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                        <option value="">Select Center</option>
                        {centers.map((center) => (<option key={center.id} value={center.id}>{center.name} ({center.city})</option>))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Batch Code *</label>
                      <input type="text" value={bulkUploadBatchCode} onChange={(e) => setBulkUploadBatchCode(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g., JEE-2026-A" />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Download Template</label>
                    <button onClick={() => downloadTemplate(bulkUploadRole)} className="w-full px-4 py-3 bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl hover:bg-slate-200 flex items-center justify-center gap-2">
                      <Download className="w-5 h-5 text-slate-600" />
                      <span className="text-slate-700 dark:text-gray-300">Download {bulkUploadRole} Template</span>
                    </button>
                  </div>
                </div>

                {/* File Upload */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Upload File *</label>
                  <div className="border-2 border-dashed border-slate-300 dark:border-gray-700 rounded-xl p-8 text-center hover:border-blue-500 transition-colors">
                    <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={(e) => setBulkUploadFile(e.target.files?.[0] || null)} className="hidden" id="bulk-file" />
                    <label htmlFor="bulk-file" className="cursor-pointer">
                      <FileSpreadsheet className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                      {bulkUploadFile ? (
                        <p className="text-slate-900 dark:text-white font-medium">{bulkUploadFile.name}</p>
                      ) : (
                        <>
                          <p className="text-slate-600 dark:text-gray-400">Click to upload or drag and drop</p>
                          <p className="text-xs text-slate-500 mt-1">Excel (.xlsx, .xls) or CSV files</p>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                <button onClick={handleBulkUpload} disabled={loading || !bulkUploadFile}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                  Upload & Create Users
                </button>
              </div>

              {/* Bulk Upload Results */}
              {bulkUploadResult && (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 p-6">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Upload Results</h3>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-slate-50 dark:bg-gray-800 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">{bulkUploadResult.total}</p>
                      <p className="text-sm text-slate-500">Total</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-green-600">{bulkUploadResult.success}</p>
                      <p className="text-sm text-green-700">Success</p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-red-600">{bulkUploadResult.failed}</p>
                      <p className="text-sm text-red-700">Failed</p>
                    </div>
                  </div>

                  {/* Created Users List */}
                  {bulkUploadResult.created_users && bulkUploadResult.created_users.length > 0 && (
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-white mb-3">Created Users (Save these credentials!)</h4>
                      <div className="max-h-64 overflow-y-auto border border-slate-200 dark:border-gray-700 rounded-xl">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-50 dark:bg-gray-800 sticky top-0">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-bold text-slate-500">Login Code</th>
                              <th className="px-4 py-2 text-left text-xs font-bold text-slate-500">Password</th>
                              <th className="px-4 py-2 text-right text-xs font-bold text-slate-500">Copy</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
                            {bulkUploadResult.created_users.map((u, idx) => (
                              <tr key={idx}>
                                <td className="px-4 py-2 font-mono text-slate-900 dark:text-white">{u.username}</td>
                                <td className="px-4 py-2 font-mono text-slate-900 dark:text-white">{u.password}</td>
                                <td className="px-4 py-2 text-right">
                                  <button onClick={() => copyToClipboard(`${u.username}\t${u.password}`, `bulk-${idx}`)} className="p-1 hover:bg-slate-100 rounded">
                                    {copiedField === `bulk-${idx}` ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-slate-400" />}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Errors */}
                  {bulkUploadResult.errors && bulkUploadResult.errors.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium text-red-700 mb-2">Errors</h4>
                      <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 max-h-32 overflow-y-auto">
                        {bulkUploadResult.errors.map((err, idx) => (
                          <p key={idx} className="text-sm text-red-600">{err}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  <button onClick={() => setBulkUploadResult(null)} className="mt-4 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Clear Results</button>
                </div>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 p-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Settings</h3>
              <p className="text-slate-500">Settings coming soon.</p>
            </div>
          )}
        </div>
      </main>

      {/* Create Institute Modal */}
      {showCreateInstitute && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Create Institute</h3>
              <button onClick={() => setShowCreateInstitute(false)} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Institute Name *</label>
                <input type="text" value={instituteForm.name} onChange={(e) => setInstituteForm({ ...instituteForm, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g., DiracAI Institute" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Domain</label>
                <input type="text" value={instituteForm.domain} onChange={(e) => setInstituteForm({ ...instituteForm, domain: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g., diracai.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <textarea value={instituteForm.description} onChange={(e) => setInstituteForm({ ...instituteForm, description: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none" rows={3} placeholder="Brief description..." />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCreateInstitute(false)} className="flex-1 px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50">Cancel</button>
              <button onClick={handleCreateInstitute} disabled={loading} className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Center Modal */}
      {showCreateCenter && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Create Center</h3>
              <button onClick={() => setShowCreateCenter(false)} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Institute *</label>
                <select value={centerForm.institute_id} onChange={(e) => setCenterForm({ ...centerForm, institute_id: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">Select Institute</option>
                  {institutes.map((inst) => (<option key={inst.id} value={inst.id}>{inst.name}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Center Name *</label>
                <input type="text" value={centerForm.name} onChange={(e) => setCenterForm({ ...centerForm, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g., DiracAI Mumbai Center" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">City *</label>
                <input type="text" value={centerForm.city} onChange={(e) => setCenterForm({ ...centerForm, city: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g., Mumbai" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Address</label>
                <textarea value={centerForm.address} onChange={(e) => setCenterForm({ ...centerForm, address: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none" rows={2} placeholder="Full address..." />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCreateCenter(false)} className="flex-1 px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50">Cancel</button>
              <button onClick={handleCreateCenter} disabled={loading} className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Delete {deleteConfirm.type}?</h3>
              <p className="text-slate-500 mb-6">Are you sure you want to delete <span className="font-medium">{deleteConfirm.name}</span>? This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50">Cancel</button>
                <button onClick={() => deleteConfirm.type === "center" ? handleDeleteCenter(deleteConfirm.id as string) : handleDeleteUser(deleteConfirm.id)}
                  disabled={loading} className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
