import { useState, useEffect } from "react";
import { api } from "../../hooks/useApi";
import { useAuthContext } from "../../contexts/AuthContext";
import { 
  UserPlus, 
  Upload, 
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
  Building2,
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

const UsersContent = () => {
  const { user: currentUser } = useAuthContext();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAssignCenterModal, setShowAssignCenterModal] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [userCredentials, setUserCredentials] = useState<{username: string; password: string} | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [centers, setCenters] = useState<any[]>([]);
  const [selectedCenterId, setSelectedCenterId] = useState<string>("");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importRole, setImportRole] = useState<string>("student");
  const [importCenterId, setImportCenterId] = useState<string>("");
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
  const itemsPerPage = 10;

  useEffect(() => {
    fetchUsers();
  }, [currentUser?.institute_id]);

  const fetchUsers = async () => {
    const instituteId = currentUser?.institute_id || currentUser?.institute?.id;
    if (!instituteId) return;
    setLoading(true);
    try {
      const response = await api.get(`/auth/people/?institute_id=${instituteId}`);
      const data = response.data.users || response.data.results || response.data;
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const fetchCenters = async () => {
    const instituteId = currentUser?.institute_id || currentUser?.institute?.id;
    if (!instituteId) return;
    
    try {
      // Use timetable centers endpoint
      const response = await api.get(`/timetable/centers/?institute_id=${instituteId}`);
      // The response format is { count: X, results: [...] }
      const centersData = response.data.results || response.data.centers || response.data || [];
      setCenters(Array.isArray(centersData) ? centersData : []);
      console.log('Fetched centers:', centersData); // Debug log
    } catch (error) {
      console.error("Error fetching centers:", error);
      setError("Failed to fetch centers. Please try again.");
    }
  };

  const handleAssignCenter = async () => {
    if (!selectedUser || !selectedCenterId) {
      setError("Please select a center");
      return;
    }

    try {
      setError("");
      setLoading(true);
      
      await api.post('/auth/assign-center/', {
        user_id: selectedUser.id,
        center_id: selectedCenterId
      });
      
      setShowAssignCenterModal(false);
      setSelectedUser(null);
      setSelectedCenterId("");
      
      alert(`Successfully assigned center to ${selectedUser.email}`);
      fetchUsers();
    } catch (error: any) {
      console.error("Error assigning center:", error);
      setError(error.response?.data?.error || "Failed to assign center");
    } finally {
      setLoading(false);
    }
  };

  const openAssignCenterModal = (user: UserData) => {
    setSelectedUser(user);
    setShowAssignCenterModal(true);
    fetchCenters();
  };

  const handleAddUser = async () => {
    const instituteId = currentUser?.institute_id || currentUser?.institute?.id;
    if (!instituteId) {
      setError("Institute ID is required");
      return;
    }

    // Validate required fields
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
      let requiresPassword = false;
      
      // Determine if this role requires password or uses auto-generation
      const roleLower = newUser.role.toLowerCase();
      if (roleLower === 'super_admin') {
        requiresPassword = true;
      } else {
        useAutoGeneration = true;
      }
      
      // Validate password for roles that require it
      if (requiresPassword) {
        if (!newUser.password) {
          setError("Password is required for this role");
          setLoading(false);
          return;
        }
        if (newUser.password !== newUser.password_confirm) {
          setError("Passwords do not match");
          setLoading(false);
          return;
        }
      }
      
      // Use appropriate endpoint based on role
      switch (roleLower) {
        case 'admin':
          // For admin, use registration endpoint with auto-generated credentials
          const adminUsername = newUser.username || `ADM-${newUser.email.split('@')[0]}`;
          const adminPassword = newUser.password || `Admin@${new Date().getFullYear()}`;
          
          response = await api.post('/auth/register/', {
            username: adminUsername,
            email: newUser.email,
            password: adminPassword,
            password_confirm: adminPassword,
            first_name: newUser.first_name,
            last_name: newUser.last_name,
            role: 'admin',  // Changed to lowercase
            institute_id: instituteId
          });
          
          // If center was selected, assign it after creation
          if (selectedCenterId && response.data.id) {
            try {
              await api.post('/auth/assign-center/', {
                user_id: response.data.id,
                center_id: selectedCenterId
              });
            } catch (centerError) {
              console.error('Failed to assign center:', centerError);
              // Continue anyway - center can be assigned later
            }
          }
          
          // Set credentials for display
          response.data = {
            ...response.data,
            username: adminUsername,
            password: adminPassword
          };
          useAutoGeneration = true;
          break;
          
        case 'teacher':
          endpoint = '/timetable/superadmin/teachers/create/';
          response = await api.post(endpoint, {
            center_id: selectedCenterId || undefined,
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
            center_name: selectedCenterId || undefined,
            name: fullName,
            email: newUser.email,
            phone_number: newUser.username || '',
          });
          break;
          
        case 'student':
          // For students, use registration endpoint with auto-generated username
          const autoUsername = newUser.username || `STU-${newUser.email.split('@')[0]}`;
          const autoPassword = newUser.password || `Student@${new Date().getFullYear()}`;
          
          response = await api.post('/auth/register/', {
            username: autoUsername,
            email: newUser.email,
            password: autoPassword,
            password_confirm: autoPassword,
            first_name: newUser.first_name,
            last_name: newUser.last_name,
            role: 'student',  // Changed to lowercase
            institute_id: instituteId
          });
          
          // Set credentials for display
          response.data = {
            ...response.data,
            username: autoUsername,
            password: autoPassword
          };
          useAutoGeneration = true;
          break;
          
        case 'super_admin':
        default:
          // For super_admin, use registration endpoint with provided password
          response = await api.post('/auth/register/', {
            username: newUser.username || newUser.email.split('@')[0],
            email: newUser.email,
            password: newUser.password,
            password_confirm: newUser.password_confirm,
            first_name: newUser.first_name,
            last_name: newUser.last_name,
            role: newUser.role.toUpperCase(),
            institute_id: instituteId
          });
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
      setSelectedCenterId("");
      setCurrentPage(1);
      await fetchUsers();
      
      // Show credentials if they were auto-generated
      if (useAutoGeneration && response?.data?.username && response?.data?.password) {
        setUserCredentials({
          username: response.data.username,
          password: response.data.password
        });
        setShowCredentialsModal(true);
      } else {
        alert("User added successfully!");
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
      fetchUsers(); // Refresh the list
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
    // Refresh the list one more time to ensure the new user appears
    fetchUsers();
  };

  const handleExport = () => {
    const csv = [
      ["Username", "Email", "Role", "Institute", "Status"],
      ...users.map(u => [
        u.username,
        u.email,
        u.role,
        u.institute_name || "N/A",
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

    if (!importCenterId) {
      setError("Please select a center for the users");
      return;
    }

    const instituteId = currentUser?.institute_id || currentUser?.institute?.id;
    if (!instituteId) return;

    try {
      setError("");
      setLoading(true);

      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('center_id', importCenterId);

      // Determine which endpoint to use based on selected role
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
      setImportCenterId('');
      
      const successCount = response.data.success || response.data.created_count || 0;
      const totalCount = response.data.total || 0;
      alert(`Successfully imported ${successCount} out of ${totalCount} users!`);
      
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
    
    // Handle admin role variations
    if (activeTab === "admin") {
      const userRole = user.role.toLowerCase();
      return matchesSearch && (userRole === 'admin' || userRole === 'institute_admin');
    }
    
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
      super_admin: users.filter(u => u.role.toLowerCase() === 'super_admin').length,
      admin: users.filter(u => {
        const role = u.role.toLowerCase();
        return role === 'admin' || role === 'institute_admin';
      }).length,
      student: users.filter(u => u.role.toLowerCase() === 'student').length,
      teacher: users.filter(u => u.role.toLowerCase() === 'teacher').length,
      staff: users.filter(u => u.role.toLowerCase() === 'staff').length,
      manager: users.filter(u => u.role.toLowerCase() === 'manager').length,
    };
  };

  const roleCounts = getRoleCounts();

  const getRoleBadgeStyle = (role: string) => {
    const roleLower = role.toLowerCase();
    switch (roleLower) {
      case 'super_admin':
        return 'bg-purple-50 text-purple-700 ring-purple-700/10';
      case 'admin':
      case 'institute_admin':
        return 'bg-indigo-50 text-indigo-700 ring-indigo-700/10';
      case 'manager':
        return 'bg-blue-50 text-blue-700 ring-blue-700/10';
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
      case 'super_admin':
        return 'bg-purple-100 text-purple-600';
      case 'manager':
        return 'bg-blue-100 text-blue-600';
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
            User Management
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage access, track roles, and update user details across your organization.
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
            onClick={() => {
              setShowImportModal(true);
              fetchCenters();
            }}
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
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="sm:flex sm:items-baseline">
            <div className="px-4 sm:px-6 pt-4">
              <nav className="-mb-px flex space-x-6">
                <button
                  onClick={() => setActiveTab("all")}
                  className={`${
                    activeTab === "all"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  } whitespace-nowrap border-b-2 pb-4 px-1 text-sm font-medium`}
                >
                  All Users
                  <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                    activeTab === "all" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
                  }`}>
                    {roleCounts.all}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab("super_admin")}
                  className={`${
                    activeTab === "super_admin"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  } whitespace-nowrap border-b-2 pb-4 px-1 text-sm font-medium`}
                >
                  Super Admins
                  <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                    activeTab === "super_admin" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
                  }`}>
                    {roleCounts.super_admin || 0}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab("admin")}
                  className={`${
                    activeTab === "admin"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  } whitespace-nowrap border-b-2 pb-4 px-1 text-sm font-medium`}
                >
                  Admins
                  <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                    activeTab === "admin" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
                  }`}>
                    {roleCounts.admin || 0}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab("teacher")}
                  className={`${
                    activeTab === "teacher"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  } whitespace-nowrap border-b-2 pb-4 px-1 text-sm font-medium`}
                >
                  Teachers
                  <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                    activeTab === "teacher" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
                  }`}>
                    {roleCounts.teacher || 0}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab("student")}
                  className={`${
                    activeTab === "student"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  } whitespace-nowrap border-b-2 pb-4 px-1 text-sm font-medium`}
                >
                  Students
                  <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                    activeTab === "student" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
                  }`}>
                    {roleCounts.student || 0}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab("staff")}
                  className={`${
                    activeTab === "staff"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  } whitespace-nowrap border-b-2 pb-4 px-1 text-sm font-medium`}
                >
                  Staff
                  <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                    activeTab === "staff" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
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
              placeholder="Search by name, email, or ID..."
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
                    Center
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    Institute
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
                {paginatedUsers.map((user) => (
                  <tr key={user.id} className="group hover:bg-gray-50 transition-colors">
                    <td className="py-4 pl-4 pr-3 text-sm sm:pl-6">
                      <input
                        type="checkbox"
                        checked={selectedUsers.has(user.id)}
                        onChange={() => toggleSelectUser(user.id)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                      />
                    </td>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm">
                      <div className="flex items-center">
                        <div className={`h-10 w-10 flex-shrink-0 rounded-full ${getAvatarColor(user.role)} flex items-center justify-center font-bold`}>
                          {getInitials(user)}
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-gray-900">
                            {user.first_name && user.last_name 
                              ? `${user.first_name} ${user.last_name}`
                              : user.username}
                          </div>
                          <div className="text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getRoleBadgeStyle(user.role)}`}>
                        {getRoleDisplayName(user.role)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                      {user.center || user.center_name ? (
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700">
                            {user.center?.name || user.center_name}
                          </span>
                        </div>
                      ) : (
                        <button
                          onClick={() => openAssignCenterModal(user)}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                        >
                          Assign Center
                        </button>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {user.institute_name || "N/A"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                      <div className="flex items-center gap-x-2">
                        <div className={`h-2 w-2 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <span className="text-gray-700">{user.is_active ? 'Active' : 'Offline'}</span>
                      </div>
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <button 
                        onClick={() => {/* TODO: Implement edit */}}
                        className="text-gray-400 hover:text-blue-600 mr-3"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> of{' '}
                <span className="font-medium">{filteredUsers.length}</span> results
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 disabled:opacity-50"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                {[...Array(Math.min(totalPages, 5))].map((_, idx) => {
                  const pageNum = idx + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                        currentPage === pageNum
                          ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                          : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                {totalPages > 5 && (
                  <>
                    <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300">
                      ...
                    </span>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20"
                    >
                      {totalPages}
                    </button>
                  </>
                )}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 disabled:opacity-50"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Assign Center Modal */}
      {showAssignCenterModal && selectedUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowAssignCenterModal(false)}></div>
            
            <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
              <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold leading-6 text-gray-900">Assign Center to User</h3>
                  <button onClick={() => setShowAssignCenterModal(false)} className="text-gray-400 hover:text-gray-500">
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {error && (
                  <div className="mb-4 rounded-md bg-red-50 p-4">
                    <div className="flex">
                      <AlertCircle className="h-5 w-5 text-red-400" />
                      <div className="ml-3">
                        <p className="text-sm text-red-800">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="rounded-md bg-blue-50 p-4">
                    <div className="flex">
                      <Building2 className="h-5 w-5 text-blue-400" />
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">Admin User</h3>
                        <div className="mt-2 text-sm text-blue-700">
                          <p><strong>Name:</strong> {selectedUser.first_name} {selectedUser.last_name || selectedUser.username}</p>
                          <p><strong>Email:</strong> {selectedUser.email}</p>
                          <p><strong>Role:</strong> {getRoleDisplayName(selectedUser.role)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Center
                    </label>
                    <select
                      value={selectedCenterId}
                      onChange={(e) => setSelectedCenterId(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                    >
                      <option value="">-- Select a Center --</option>
                      {centers.map((center) => (
                        <option key={center.id} value={center.id}>
                          {center.name} - {center.city}
                        </option>
                      ))}
                    </select>
                    {centers.length === 0 && (
                      <p className="mt-2 text-sm text-gray-500">No centers available. Please create a center first.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  type="button"
                  onClick={handleAssignCenter}
                  disabled={!selectedCenterId || loading}
                  className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Assigning..." : "Assign Center"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAssignCenterModal(false)}
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Excel Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowImportModal(false)}></div>
            
            <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
              <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold leading-6 text-gray-900">Import Users from Excel/CSV</h3>
                  <button onClick={() => setShowImportModal(false)} className="text-gray-400 hover:text-gray-500">
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {error && (
                  <div className="mb-4 rounded-md bg-red-50 p-4">
                    <div className="flex">
                      <AlertCircle className="h-5 w-5 text-red-400" />
                      <div className="ml-3">
                        <p className="text-sm text-red-800">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Role to Import
                    </label>
                    <select
                      value={importRole}
                      onChange={(e) => setImportRole(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                    >
                      <option value="student">Students</option>
                      <option value="teacher">Teachers</option>
                      <option value="staff">Staff</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Center <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={importCenterId}
                      onChange={(e) => setImportCenterId(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                      required
                    >
                      <option value="">-- Select a Center --</option>
                      {centers.map((center) => (
                        <option key={center.id} value={center.id}>
                          {center.name} - {center.city}
                        </option>
                      ))}
                    </select>
                    {centers.length === 0 && (
                      <p className="mt-2 text-sm text-red-500">No centers available. Please create a center first.</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">All imported users will be assigned to this center</p>
                  </div>

                  <div className="rounded-md bg-blue-50 p-4">
                    <div className="flex">
                      <AlertCircle className="h-5 w-5 text-blue-400" />
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">File Format Requirements</h3>
                        <div className="mt-2 text-sm text-blue-700">
                          <p className="mb-2">Your Excel/CSV file should have these columns for <strong>{importRole}s</strong>:</p>
                          <ul className="list-disc list-inside space-y-1">
                            {importRole === 'teacher' && (
                              <>
                                <li><strong>name</strong> - Full name</li>
                                <li><strong>email</strong> - Email address</li>
                                <li><strong>phone_number</strong> - Phone number</li>
                                <li><strong>employee_id</strong> - Employee ID</li>
                                <li><strong>subjects</strong> - Subjects (comma-separated)</li>
                              </>
                            )}
                            {importRole === 'student' && (
                              <>
                                <li><strong>name</strong> - Full name</li>
                                <li><strong>email</strong> - Email address</li>
                                <li><strong>phone_number</strong> - Phone number</li>
                                <li><strong>batch_code</strong> - Batch code</li>
                                <li><strong>date_of_birth</strong> - Date of birth (YYYY-MM-DD)</li>
                              </>
                            )}
                            {importRole === 'staff' && (
                              <>
                                <li><strong>name</strong> - Full name</li>
                                <li><strong>email</strong> - Email address</li>
                                <li><strong>phone_number</strong> - Phone number</li>
                              </>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={downloadTemplate}
                      className="w-full inline-flex justify-center items-center gap-2 rounded-md bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
                    >
                      <Download className="h-4 w-4" />
                      Download Template File
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Excel/CSV File
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
                      <div className="space-y-1 text-center">
                        <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600">
                          <label className="relative cursor-pointer rounded-md bg-white font-medium text-blue-600 hover:text-blue-500">
                            <span>Upload a file</span>
                            <input
                              type="file"
                              accept=".csv,.xlsx,.xls"
                              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                              className="sr-only"
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">CSV, XLSX, XLS up to 10MB</p>
                        {importFile && (
                          <p className="text-sm text-green-600 font-medium mt-2">
                            Selected: {importFile.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  type="button"
                  onClick={handleImportUsers}
                  disabled={!importFile || !importCenterId || loading}
                  className="inline-flex w-full justify-center rounded-md bg-purple-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-500 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" onLoad={() => fetchCenters()}>
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowAddUserModal(false)}></div>
            
            <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
              <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold leading-6 text-gray-900">Add New User</h3>
                  <button onClick={() => setShowAddUserModal(false)} className="text-gray-400 hover:text-gray-500">
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {error && (
                  <div className="mb-4 rounded-md bg-red-50 p-4">
                    <div className="flex">
                      <AlertCircle className="h-5 w-5 text-red-400" />
                      <div className="ml-3">
                        <p className="text-sm text-red-800">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">First Name</label>
                      <input
                        type="text"
                        value={newUser.first_name}
                        onChange={(e) => setNewUser({...newUser, first_name: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Last Name</label>
                      <input
                        type="text"
                        value={newUser.last_name}
                        onChange={(e) => setNewUser({...newUser, last_name: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Username <span className="text-xs text-gray-500">(Optional - will be auto-generated)</span>
                    </label>
                    <input
                      type="text"
                      value={newUser.username}
                      onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                      placeholder="Leave empty for auto-generation"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email *</label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Password {(newUser.role === 'manager' || newUser.role === 'super_admin') ? '*' : <span className="text-xs text-gray-500">(Optional - will be auto-generated)</span>}
                    </label>
                    <input
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                      placeholder={(newUser.role === 'manager' || newUser.role === 'super_admin') ? "Enter password" : "Leave empty for auto-generation"}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Confirm Password {(newUser.role === 'manager' || newUser.role === 'super_admin') ? '*' : <span className="text-xs text-gray-500">(If password provided)</span>}
                    </label>
                    <input
                      type="password"
                      value={newUser.password_confirm}
                      onChange={(e) => setNewUser({...newUser, password_confirm: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                      placeholder={(newUser.role === 'manager' || newUser.role === 'super_admin') ? "Confirm password" : "Confirm password if provided"}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <select
                      value={newUser.role}
                      onChange={(e) => {
                        setNewUser({...newUser, role: e.target.value});
                        // Fetch centers when admin or teacher is selected
                        if (e.target.value === 'admin' || e.target.value === 'teacher') {
                          fetchCenters();
                        }
                      }}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                    >
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                      <option value="admin">Admin</option>
                      <option value="staff">Staff</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </div>

                  {/* Center Selection - Only for Admin and Teacher */}
                  {(newUser.role === 'admin' || newUser.role === 'teacher') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Center <span className="text-xs text-gray-500">(Optional - can be assigned later)</span>
                      </label>
                      <select
                        value={selectedCenterId}
                        onChange={(e) => setSelectedCenterId(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                      >
                        <option value="">-- Select a Center (Optional) --</option>
                        {centers.map((center) => (
                          <option key={center.id} value={center.id}>
                            {center.name} - {center.city}
                          </option>
                        ))}
                      </select>
                      {centers.length === 0 && (
                        <p className="mt-1 text-xs text-gray-500">No centers available. You can assign a center later.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  type="button"
                  onClick={handleAddUser}
                  className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto"
                >
                  Add User
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

      {/* User Credentials Modal */}
      {showCredentialsModal && userCredentials && (
        <div className="fixed inset-0 z-50" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all w-full max-w-md">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-green-500 to-green-600 px-4 py-4 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        User Created Successfully!
                      </h3>
                      <p className="text-xs text-green-100">
                        Save these credentials securely
                      </p>
                    </div>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="px-4 py-5">
                  <div className="mb-4 rounded-md bg-amber-50 border border-amber-200 p-3">
                    <div className="flex">
                      <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div className="ml-2">
                        <p className="text-sm font-medium text-amber-800">Important!</p>
                        <p className="text-xs text-amber-700 mt-1">
                          These credentials will only be shown once. Please copy and save them now.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Username */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Username
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-50 border border-gray-200 rounded-md px-3 py-2.5">
                          <p className="text-sm font-mono font-semibold text-gray-900">
                            {userCredentials.username}
                          </p>
                        </div>
                        <button
                          onClick={() => copyToClipboard(userCredentials.username, 'username')}
                          className="flex-shrink-0 p-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-md transition-colors"
                          title="Copy username"
                        >
                          {copiedField === 'username' ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Password
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-50 border border-gray-200 rounded-md px-3 py-2.5">
                          <p className="text-sm font-mono font-semibold text-gray-900">
                            {userCredentials.password}
                          </p>
                        </div>
                        <button
                          onClick={() => copyToClipboard(userCredentials.password, 'password')}
                          className="flex-shrink-0 p-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-md transition-colors"
                          title="Copy password"
                        >
                          {copiedField === 'password' ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-md bg-blue-50 border border-blue-200 p-3">
                    <p className="text-xs text-blue-800">
                      <span className="font-semibold">Next steps:</span> Share these credentials with the user securely. 
                      They can change their password after first login.
                    </p>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCloseCredentials}
                    className="w-full inline-flex justify-center rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                  >
                    I've Saved the Credentials
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersContent;
