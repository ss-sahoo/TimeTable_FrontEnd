import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  Edit, 
  Trash2, 
  Users as UsersIcon, 
  UserPlus,
  Mail,
  Phone,
  Calendar,
  Shield,
  CheckCircle,
  AlertCircle,
  Clock,
  Building2,
  GraduationCap,
  Settings,
  Ban,
  UserCheck,
  X,
  Loader2
} from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { api } from '../hooks/useApi';

interface UserData {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: 'super_admin' | 'institute_admin' | 'exam_admin' | 'teacher' | 'student' | 'staff' | 'STAFF';
  is_active: boolean;
  is_verified: boolean;
  last_login: string;
  created_at: string;
  institute: {
    id: number;
    name: string;
  };
}

export default function Users() {
  const { user } = useAuthContext();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);
  const [addUserForm, setAddUserForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: 'teacher',
    employee_id: '',
    subjects: '',
  });
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    role: 'teacher',
    is_active: true,
    is_verified: false,
  });
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'teacher',
    message: '',
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/users/');
      setUsers(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const openInviteModal = () => {
    setInviteForm({ email: '', role: 'teacher', message: '' });
    setActionError(null);
    setActionMessage(null);
    setInviteModalOpen(true);
  };

  const openAddUserModal = () => {
    setAddUserForm({ 
      first_name: '', 
      last_name: '', 
      email: '',
      phone: '', 
      role: 'teacher',
      employee_id: '',
      subjects: '',
    });
    setActionError(null);
    setActionMessage(null);
    setAddUserModalOpen(true);
  };

  const openViewModal = async (userId: number) => {
    try {
      setActionError(null);
      const response = await api.get(`/auth/users/${userId}/`);
      setSelectedUser(response.data);
      setViewModalOpen(true);
    } catch (error: any) {
      console.error('Failed to load user details:', error);
      setActionError('Failed to load user details.');
    }
  };

  const openEditModal = async (userId: number) => {
    try {
      setActionError(null);
      const response = await api.get(`/auth/users/${userId}/`);
      const userData: UserData = response.data;
      setSelectedUser(userData);
      setEditForm({
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        phone: userData.phone || '',
        role: userData.role,
        is_active: userData.is_active,
        is_verified: userData.is_verified,
      });
      setEditModalOpen(true);
    } catch (error: any) {
      console.error('Failed to load user for editing:', error);
      setActionError('Failed to load user for editing.');
    }
  };

  const openDeleteModal = (userData: UserData) => {
    setSelectedUser(userData);
    setActionError(null);
    setDeleteModalOpen(true);
  };

  const closeModals = () => {
    setViewModalOpen(false);
    setEditModalOpen(false);
    setDeleteModalOpen(false);
    setInviteModalOpen(false);
    setAddUserModalOpen(false);
    setSelectedUser(null);
    setFormSubmitting(false);
  };

  const roles = [
    { value: 'super_admin', label: 'Super Admin' },
    { value: 'institute_admin', label: 'Institute Admin' },
    { value: 'exam_admin', label: 'Exam Admin' },
    { value: 'teacher', label: 'Teacher' },
    { value: 'student', label: 'Student' },
  ];

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const instituteId = user?.institute_id ?? (user as any)?.institute?.id ?? null;
    if (!instituteId) {
      setActionError('Institute information is missing.');
      return;
    }

    setFormSubmitting(true);
    setActionError(null);
    setActionMessage(null);

    try {
      await api.post('/auth/invitations/', {
        institute: instituteId,
        email: inviteForm.email,
        role: inviteForm.role,
        message: inviteForm.message,
      });
      setActionMessage(`Invitation sent to ${inviteForm.email}.`);
      setInviteForm({ email: '', role: 'teacher', message: '' });
    } catch (error: any) {
      console.error('Failed to send invitation:', error);
      setActionError(error.response?.data?.error || 'Failed to send invitation.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setFormSubmitting(true);
    setActionError(null);

    try {
      await api.patch(`/auth/users/${selectedUser.id}/`, {
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        phone: editForm.phone,
        role: editForm.role,
        is_active: editForm.is_active,
        is_verified: editForm.is_verified,
      });
      await fetchUsers();
      closeModals();
    } catch (error: any) {
      console.error('Failed to update user:', error);
      setActionError(error.response?.data?.detail || 'Failed to update user.');
      setFormSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setFormSubmitting(true);
    setActionError(null);

    try {
      await api.delete(`/auth/users/${selectedUser.id}/`);
      await fetchUsers();
      closeModals();
    } catch (error: any) {
      console.error('Failed to delete user:', error);
      setActionError(error.response?.data?.detail || 'Failed to delete user.');
      setFormSubmitting(false);
    }
  };

  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!addUserForm.first_name.trim()) {
      setActionError('First name is required');
      return;
    }

    setFormSubmitting(true);
    setActionError(null);
    setActionMessage(null);

    try {
      // For teachers, use the timetable teacher creation API
      if (addUserForm.role === 'teacher') {
        const endpoint = user?.role === 'super_admin' || user?.role === 'SUPER_ADMIN'
          ? '/timetable/superadmin/teachers/create/'
          : '/timetable/admin/teachers/create/';

        const payload: any = {
          name: `${addUserForm.first_name} ${addUserForm.last_name}`.trim(),
          email: addUserForm.email || undefined,
          phone_number: addUserForm.phone || undefined,
          employee_id: addUserForm.employee_id || undefined,
          subjects: addUserForm.subjects || undefined,
        };

        // Add center info for super admin
        if (user?.role === 'super_admin' || user?.role === 'SUPER_ADMIN') {
          // Get center info from user profile
          try {
            const profileResponse = await api.get('/auth/profile/');
            const centerId = profileResponse.data?.center_id || user?.center_id;
            const centerName = profileResponse.data?.center_name || profileResponse.data?.center?.name;
            
            if (centerId) {
              payload.center_id = centerId;
            } else if (centerName) {
              payload.center_name = centerName;
            }
          } catch (error) {
            console.error('Failed to get center info:', error);
          }
        }

        const response = await api.post(endpoint, payload);
        
        setActionMessage(`Teacher created successfully! Username: ${response.data.username}, Password: ${response.data.password}`);
        
        // Refresh users list
        await fetchUsers();
        
        // Reset form
        setAddUserForm({
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          role: 'teacher',
          employee_id: '',
          subjects: '',
        });
      } else {
        // For other roles, use the generic user creation API
        const response = await api.post('/auth/users/', {
          first_name: addUserForm.first_name,
          last_name: addUserForm.last_name,
          email: addUserForm.email,
          phone: addUserForm.phone,
          role: addUserForm.role,
        });
        
        setActionMessage('User created successfully!');
        await fetchUsers();
        
        // Reset form
        setAddUserForm({
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          role: 'teacher',
          employee_id: '',
          subjects: '',
        });
      }
    } catch (error: any) {
      console.error('Failed to create user:', error);
      setActionError(error.response?.data?.error || error.response?.data?.detail || 'Failed to create user.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      case 'institute_admin':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400';
      case 'exam_admin':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
      case 'teacher':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'student':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Shield className="w-3 h-3" />;
      case 'institute_admin':
        return <Building2 className="w-3 h-3" />;
      case 'exam_admin':
        return <Settings className="w-3 h-3" />;
      case 'teacher':
        return <GraduationCap className="w-3 h-3" />;
      case 'student':
        return <UsersIcon className="w-3 h-3" />;
      default:
        return <UsersIcon className="w-3 h-3" />;
    }
  };

  const filteredUsers = users.filter(userData => {
    const matchesSearch = 
      userData.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userData.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userData.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || userData.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && userData.is_active) ||
                         (statusFilter === 'inactive' && !userData.is_active);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getUserStats = () => {
    return {
      total: users.length,
      active: users.filter(u => u.is_active).length,
      inactive: users.filter(u => !u.is_active).length,
      verified: users.filter(u => u.is_verified).length,
      unverified: users.filter(u => !u.is_verified).length,
    };
  };

  const getRoleStats = () => {
    return {
      super_admin: users.filter(u => u.role === 'super_admin').length,
      institute_admin: users.filter(u => u.role === 'institute_admin').length,
      exam_admin: users.filter(u => u.role === 'exam_admin').length,
      teacher: users.filter(u => u.role === 'teacher').length,
      student: users.filter(u => u.role === 'student').length,
    };
  };

  const stats = getUserStats();
  const roleStats = getRoleStats();

  const statCards = [
    {
      label: 'Total Users',
      value: stats.total,
      description: 'All accounts in your institute',
      icon: UsersIcon,
      iconClass: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-50 dark:bg-emerald-500/10'
    },
    {
      label: 'Active',
      value: stats.active,
      description: 'Users currently enabled for access',
      icon: CheckCircle,
      iconClass: 'text-sky-600 dark:text-sky-400',
      iconBg: 'bg-sky-50 dark:bg-sky-500/10'
    },
    {
      label: 'Inactive',
      value: stats.inactive,
      description: 'Disabled accounts awaiting review',
      icon: AlertCircle,
      iconClass: 'text-slate-500 dark:text-slate-300',
      iconBg: 'bg-slate-100 dark:bg-slate-500/10'
    },
    {
      label: 'Verified',
      value: stats.verified,
      description: 'Email confirmed and verified users',
      icon: UserCheck,
      iconClass: 'text-indigo-600 dark:text-indigo-400',
      iconBg: 'bg-indigo-50 dark:bg-indigo-500/10'
    },
    {
      label: 'Pending',
      value: stats.unverified,
      description: 'Invited users awaiting verification',
      icon: Clock,
      iconClass: 'text-amber-600 dark:text-amber-400',
      iconBg: 'bg-amber-50 dark:bg-amber-500/10'
    }
  ];

  const roleDistribution = [
    { label: 'Super Admin', value: roleStats.super_admin, color: 'bg-rose-500' },
    { label: 'Institute Admin', value: roleStats.institute_admin, color: 'bg-purple-500' },
    { label: 'Exam Admin', value: roleStats.exam_admin, color: 'bg-sky-500' },
    { label: 'Teachers', value: roleStats.teacher, color: 'bg-emerald-500' },
    { label: 'Students', value: roleStats.student, color: 'bg-amber-500' }
  ];

  const totalRoleCount = roleDistribution.reduce((sum, item) => sum + item.value, 0) || 1;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-gray-400">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen" style={{ backgroundColor: '#f9fafb' }}>
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-black">User Management</h1>
            <p className="text-base" style={{ color: '#6b6b6b' }}>Manage access, track roles, and update user details across your organization.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              className="inline-flex items-center gap-2 px-3 py-2 text-sm border rounded-lg transition-colors"
              style={{ borderColor: '#e5e7eb', color: '#6b6b6b', backgroundColor: '#ffffff' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
            >
              Export
            </button>
            <button 
              className="inline-flex items-center gap-2 px-3 py-2 text-sm text-white rounded-lg transition-colors"
              style={{ backgroundColor: '#7c3aed' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#6d28d9'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#7c3aed'}
            >
              Import Excel
            </button>
            <button 
              className="inline-flex items-center gap-2 px-3 py-2 text-sm text-white rounded-lg transition-colors"
              style={{ backgroundColor: '#3b82f6' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
              onClick={openAddUserModal}
            >
              <UserPlus className="w-4 h-4" />
              Add User
            </button>
          </div>
        </div>

        {/* Role Tabs */}
        <div className="mb-6 border-b" style={{ borderColor: '#e5e7eb' }}>
          <div className="flex gap-6">
            <button
              onClick={() => setRoleFilter('all')}
              className={`pb-3 px-1 text-sm font-medium transition-colors relative ${
                roleFilter === 'all' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              All Users
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full" style={{ 
                backgroundColor: roleFilter === 'all' ? '#dbeafe' : '#f3f4f6',
                color: roleFilter === 'all' ? '#1e40af' : '#6b7280'
              }}>
                {stats.total}
              </span>
              {roleFilter === 'all' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
              )}
            </button>
            <button
              onClick={() => setRoleFilter('super_admin')}
              className={`pb-3 px-1 text-sm font-medium transition-colors relative ${
                roleFilter === 'super_admin' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Super Admins
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full" style={{ 
                backgroundColor: roleFilter === 'super_admin' ? '#dbeafe' : '#f3f4f6',
                color: roleFilter === 'super_admin' ? '#1e40af' : '#6b7280'
              }}>
                {roleStats.super_admin}
              </span>
              {roleFilter === 'super_admin' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
              )}
            </button>
            <button
              onClick={() => setRoleFilter('institute_admin')}
              className={`pb-3 px-1 text-sm font-medium transition-colors relative ${
                roleFilter === 'institute_admin' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Admins
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full" style={{ 
                backgroundColor: roleFilter === 'institute_admin' ? '#dbeafe' : '#f3f4f6',
                color: roleFilter === 'institute_admin' ? '#1e40af' : '#6b7280'
              }}>
                {roleStats.institute_admin}
              </span>
              {roleFilter === 'institute_admin' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
              )}
            </button>
            <button
              onClick={() => setRoleFilter('teacher')}
              className={`pb-3 px-1 text-sm font-medium transition-colors relative ${
                roleFilter === 'teacher' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Teachers
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full" style={{ 
                backgroundColor: roleFilter === 'teacher' ? '#dbeafe' : '#f3f4f6',
                color: roleFilter === 'teacher' ? '#1e40af' : '#6b7280'
              }}>
                {roleStats.teacher}
              </span>
              {roleFilter === 'teacher' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
              )}
            </button>
            <button
              onClick={() => setRoleFilter('student')}
              className={`pb-3 px-1 text-sm font-medium transition-colors relative ${
                roleFilter === 'student' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Students
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full" style={{ 
                backgroundColor: roleFilter === 'student' ? '#dbeafe' : '#f3f4f6',
                color: roleFilter === 'student' ? '#1e40af' : '#6b7280'
              }}>
                {roleStats.student}
              </span>
              {roleFilter === 'student' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
              )}
            </button>
            <button
              onClick={() => setRoleFilter('staff')}
              className={`pb-3 px-1 text-sm font-medium transition-colors relative ${
                roleFilter === 'staff' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Staff
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full" style={{ 
                backgroundColor: roleFilter === 'staff' ? '#dbeafe' : '#f3f4f6',
                color: roleFilter === 'staff' ? '#1e40af' : '#6b7280'
              }}>
                {users.filter(u => u.role === 'staff' || (u.role as any) === 'STAFF').length}
              </span>
              {roleFilter === 'staff' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
              )}
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search by name, email, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none bg-white text-black"
                style={{ borderColor: '#e5e7eb' }}
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm border rounded-lg transition-colors"
              style={{ 
                borderColor: '#e5e7eb',
                backgroundColor: showFilters ? '#f3f4f6' : '#ffffff',
                color: '#6b7280'
              }}
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t" style={{ borderColor: '#e5e7eb' }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-medium" style={{ color: '#6b7280' }}>Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="ml-2 px-2 py-1 text-xs border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none bg-white text-black"
                    style={{ borderColor: '#e5e7eb' }}
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-slate-50 dark:bg-gray-700 border-slate-200 dark:border-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input type="checkbox" className="rounded" />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-gray-300">User Details</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-gray-300">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-gray-300">Center</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-gray-300">Institute</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-gray-300">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-gray-300"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-gray-700">
                {filteredUsers.map((userData) => (
                  <tr key={userData.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3">
                      <input type="checkbox" className="rounded" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm" style={{
                          backgroundColor: userData.role === 'super_admin' ? '#ef4444' :
                          userData.role === 'institute_admin' ? '#3b82f6' :
                          userData.role === 'teacher' ? '#10b981' :
                          userData.role === 'student' ? '#f59e0b' :
                          '#6b7280'
                        }}>
                          {userData.first_name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-black dark:text-gray-100">
                            {userData.first_name} {userData.last_name}
                          </div>
                          <div className="text-xs text-slate-600 dark:text-gray-400">{userData.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium`}
                      style={{
                        backgroundColor: userData.role === 'super_admin' ? '#dbeafe' :
                        userData.role === 'institute_admin' ? '#dbeafe' :
                        userData.role === 'exam_admin' ? '#fef3c7' :
                        userData.role === 'teacher' ? '#d1fae5' :
                        userData.role === 'student' ? '#fef3c7' :
                        '#f3f4f6',
                        color: userData.role === 'super_admin' ? '#1e40af' :
                        userData.role === 'institute_admin' ? '#1e40af' :
                        userData.role === 'exam_admin' ? '#92400e' :
                        userData.role === 'teacher' ? '#065f46' :
                        userData.role === 'student' ? '#92400e' :
                        '#374151'
                      }}>
                        {userData.role === 'super_admin' ? 'Super Admin' :
                         userData.role === 'institute_admin' ? 'Institute Admin' :
                         userData.role === 'exam_admin' ? 'Exam Admin' :
                         userData.role === 'teacher' ? 'Teacher' :
                         userData.role === 'student' ? 'Student' :
                         userData.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-gray-400">
                        <Building2 className="w-4 h-4" />
                        <span>Center Test</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-black dark:text-gray-100">{userData.institute?.name || 'N/A'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium`}
                      style={{
                        backgroundColor: userData.is_active ? '#d1fae5' : '#fee2e2',
                        color: userData.is_active ? '#065f46' : '#991b1b'
                      }}>
                        <div className="w-1.5 h-1.5 rounded-full" style={{
                          backgroundColor: userData.is_active ? '#10b981' : '#ef4444'
                        }}></div>
                        {userData.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(userData.id)}
                          className="p-1 rounded transition-colors hover:bg-gray-100 dark:hover:bg-gray-600 text-slate-600 dark:text-gray-400"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(userData)}
                          className="p-1 rounded transition-colors hover:bg-gray-100 dark:hover:bg-gray-600 text-slate-600 dark:text-gray-400"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <UsersIcon className="w-12 h-12 mx-auto mb-4 text-slate-600 dark:text-gray-400" />
            <h3 className="text-lg font-medium text-black dark:text-gray-100 mb-2">No users found</h3>
            <p className="text-sm mb-4 text-slate-600 dark:text-gray-400">
              {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your search or filter criteria.' 
                : 'No users have been added yet.'}
            </p>
            {!searchTerm && roleFilter === 'all' && statusFilter === 'all' && (
              <button 
                className="inline-flex items-center gap-2 px-4 py-2 text-sm text-white bg-teal-700 dark:bg-teal-600 hover:bg-teal-800 dark:hover:bg-teal-700 rounded-lg transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Invite User
              </button>
            )}
          </div>
        )}
      </div>
    </div>

    {/* Modals */}
    {(viewModalOpen || editModalOpen || deleteModalOpen || inviteModalOpen || addUserModalOpen) && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
        <div className="relative w-full max-w-lg rounded-xl bg-white shadow-xl">
          <button
            onClick={closeModals}
            className="absolute top-3 right-3 p-1 rounded-full text-slate-500 hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {addUserModalOpen && (
            <form onSubmit={handleAddUserSubmit} className="p-6 space-y-4">
              <h2 className="text-xl font-semibold text-slate-900">Add New User</h2>
              {actionError && <p className="text-sm text-red-600">{actionError}</p>}
              {actionMessage && <p className="text-sm text-green-600">{actionMessage}</p>}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <label className="flex flex-col gap-1">
                  <span className="font-medium text-slate-600">First Name *</span>
                  <input
                    value={addUserForm.first_name}
                    onChange={(e) => setAddUserForm(prev => ({ ...prev, first_name: e.target.value }))}
                    className="border rounded-lg px-3 py-2"
                    required
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="font-medium text-slate-600">Last Name</span>
                  <input
                    value={addUserForm.last_name}
                    onChange={(e) => setAddUserForm(prev => ({ ...prev, last_name: e.target.value }))}
                    className="border rounded-lg px-3 py-2"
                  />
                </label>
                <label className="flex flex-col gap-1 md:col-span-2">
                  <span className="font-medium text-slate-600">Email</span>
                  <input
                    type="email"
                    value={addUserForm.email}
                    onChange={(e) => setAddUserForm(prev => ({ ...prev, email: e.target.value }))}
                    className="border rounded-lg px-3 py-2"
                    placeholder="teacher@example.com"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="font-medium text-slate-600">Phone</span>
                  <input
                    value={addUserForm.phone}
                    onChange={(e) => setAddUserForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="border rounded-lg px-3 py-2"
                    placeholder="9876543210"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="font-medium text-slate-600">Role *</span>
                  <select
                    value={addUserForm.role}
                    onChange={(e) => setAddUserForm(prev => ({ ...prev, role: e.target.value }))}
                    className="border rounded-lg px-3 py-2"
                  >
                    {roles.map(role => (
                      <option key={role.value} value={role.value}>{role.label}</option>
                    ))}
                  </select>
                </label>
                
                {/* Show teacher-specific fields when role is teacher */}
                {addUserForm.role === 'teacher' && (
                  <>
                    <label className="flex flex-col gap-1">
                      <span className="font-medium text-slate-600">Employee ID</span>
                      <input
                        value={addUserForm.employee_id}
                        onChange={(e) => setAddUserForm(prev => ({ ...prev, employee_id: e.target.value }))}
                        className="border rounded-lg px-3 py-2"
                        placeholder="EMP-001"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="font-medium text-slate-600">Subjects</span>
                      <input
                        value={addUserForm.subjects}
                        onChange={(e) => setAddUserForm(prev => ({ ...prev, subjects: e.target.value }))}
                        className="border rounded-lg px-3 py-2"
                        placeholder="Physics, Chemistry"
                      />
                    </label>
                  </>
                )}
              </div>
              
              {addUserForm.role === 'teacher' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                  <p className="font-medium mb-1">📝 Note:</p>
                  <p>Username and password will be auto-generated for teachers.</p>
                </div>
              )}
              
              <div className="flex justify-end gap-2">
                <button type="button" onClick={closeModals} className="px-4 py-2 text-sm rounded-lg border">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 text-sm rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 flex items-center gap-2"
                >
                  {formSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Add User'
                  )}
                </button>
              </div>
            </form>
          )}

          {viewModalOpen && selectedUser && (
            <div className="p-6 space-y-4">
              <h2 className="text-xl font-semibold text-slate-900">User Details</h2>
              <div className="space-y-2 text-sm text-slate-700">
                <p><strong>Name:</strong> {selectedUser.first_name} {selectedUser.last_name}</p>
                <p><strong>Email:</strong> {selectedUser.email}</p>
                <p><strong>Role:</strong> {selectedUser.role.replace('_', ' ')}</p>
                <p><strong>Status:</strong> {selectedUser.is_active ? 'Active' : 'Inactive'}</p>
                <p><strong>Verified:</strong> {selectedUser.is_verified ? 'Yes' : 'No'}</p>
                <p><strong>Institute:</strong> {selectedUser.institute?.name || 'N/A'}</p>
                <p><strong>Created:</strong> {new Date(selectedUser.created_at).toLocaleString()}</p>
              </div>
            </div>
          )}

          {editModalOpen && selectedUser && (
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <h2 className="text-xl font-semibold text-slate-900">Edit User</h2>
              {actionError && <p className="text-sm text-red-600">{actionError}</p>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <label className="flex flex-col gap-1">
                  <span className="font-medium text-slate-600">First Name</span>
                  <input
                    value={editForm.first_name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, first_name: e.target.value }))}
                    className="border rounded-lg px-3 py-2"
                    required
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="font-medium text-slate-600">Last Name</span>
                  <input
                    value={editForm.last_name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, last_name: e.target.value }))}
                    className="border rounded-lg px-3 py-2"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="font-medium text-slate-600">Phone</span>
                  <input
                    value={editForm.phone}
                    onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="border rounded-lg px-3 py-2"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="font-medium text-slate-600">Role</span>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                    className="border rounded-lg px-3 py-2"
                  >
                    {roles.map(role => (
                      <option key={role.value} value={role.value}>{role.label}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editForm.is_active}
                    onChange={(e) => setEditForm(prev => ({ ...prev, is_active: e.target.checked }))}
                  />
                  <span>Active</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editForm.is_verified}
                    onChange={(e) => setEditForm(prev => ({ ...prev, is_verified: e.target.checked }))}
                  />
                  <span>Verified</span>
                </label>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={closeModals} className="px-4 py-2 text-sm rounded-lg border">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 text-sm rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60"
                >
                  {formSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {deleteModalOpen && selectedUser && (
            <div className="p-6 space-y-4">
              <h2 className="text-xl font-semibold text-red-600">Delete User</h2>
              {actionError && <p className="text-sm text-red-600">{actionError}</p>}
              <p className="text-sm text-slate-700">
                Are you sure you want to delete <strong>{selectedUser.first_name} {selectedUser.last_name}</strong>? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={closeModals} className="px-4 py-2 text-sm rounded-lg border">
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUser}
                  disabled={formSubmitting}
                  className="px-4 py-2 text-sm rounded-lg text-white bg-red-600 hover:bg-red-700 disabled:opacity-60"
                >
                  {formSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
                </button>
              </div>
            </div>
          )}

          {inviteModalOpen && (
            <form onSubmit={handleInviteSubmit} className="p-6 space-y-4">
              <h2 className="text-xl font-semibold text-slate-900">Invite User</h2>
              {actionError && <p className="text-sm text-red-600">{actionError}</p>}
              {actionMessage && <p className="text-sm text-green-600">{actionMessage}</p>}
              <div className="space-y-3 text-sm">
                <label className="flex flex-col gap-1">
                  <span className="font-medium text-slate-600">Email</span>
                  <input
                    type="email"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                    className="border rounded-lg px-3 py-2"
                    required
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="font-medium text-slate-600">Role</span>
                  <select
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, role: e.target.value }))}
                    className="border rounded-lg px-3 py-2"
                  >
                    {roles.map(role => (
                      <option key={role.value} value={role.value}>{role.label}</option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="font-medium text-slate-600">Message (optional)</span>
                  <textarea
                    value={inviteForm.message}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, message: e.target.value }))}
                    className="border rounded-lg px-3 py-2"
                    rows={3}
                    placeholder="Include any instructions for the invite email"
                  />
                </label>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={closeModals} className="px-4 py-2 text-sm rounded-lg border">
                  Close
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 text-sm rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60"
                >
                  {formSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Invitation'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    )}
    </>
  );
}
