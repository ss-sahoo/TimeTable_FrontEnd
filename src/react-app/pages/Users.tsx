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
  role: 'super_admin' | 'institute_admin' | 'exam_admin' | 'teacher' | 'student';
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
            <p className="text-base" style={{ color: '#6b6b6b' }}>Manage users and their permissions</p>
          </div>
          <button 
            className="inline-flex items-center gap-2 px-3 py-2 text-sm text-white rounded-lg transition-colors"
            style={{ backgroundColor: '#216865' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1a524f'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#216865'}
            onClick={openInviteModal}
          >
            <UserPlus className="w-4 h-4" />
            Invite User
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <div className="bg-white rounded-lg border p-3" style={{ borderColor: '#e5e7eb' }}>
            <div className="flex items-center gap-2">
              <UsersIcon className="w-4 h-4" style={{ color: '#216865' }} />
              <span className="text-xs font-medium" style={{ color: '#6b6b6b' }}>Total</span>
            </div>
            <div className="text-lg font-semibold text-black mt-1">{stats.total}</div>
          </div>
          <div className="bg-white rounded-lg border p-3" style={{ borderColor: '#e5e7eb' }}>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" style={{ color: '#22c55e' }} />
              <span className="text-xs font-medium" style={{ color: '#6b6b6b' }}>Active</span>
            </div>
            <div className="text-lg font-semibold text-black mt-1">{stats.active}</div>
          </div>
          <div className="bg-white rounded-lg border p-3" style={{ borderColor: '#e5e7eb' }}>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" style={{ color: '#6b6b6b' }} />
              <span className="text-xs font-medium" style={{ color: '#6b6b6b' }}>Inactive</span>
            </div>
            <div className="text-lg font-semibold text-black mt-1">{stats.inactive}</div>
          </div>
          <div className="bg-white rounded-lg border p-3" style={{ borderColor: '#e5e7eb' }}>
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4" style={{ color: '#3b82f6' }} />
              <span className="text-xs font-medium" style={{ color: '#6b6b6b' }}>Verified</span>
            </div>
            <div className="text-lg font-semibold text-black mt-1">{stats.verified}</div>
          </div>
          <div className="bg-white rounded-lg border p-3" style={{ borderColor: '#e5e7eb' }}>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" style={{ color: '#f97316' }} />
              <span className="text-xs font-medium" style={{ color: '#6b6b6b' }}>Pending</span>
            </div>
            <div className="text-lg font-semibold text-black mt-1">{stats.unverified}</div>
          </div>
        </div>

        {/* Role Distribution */}
        <div className="bg-white rounded-lg border p-4 mb-6" style={{ borderColor: '#e5e7eb' }}>
          <h3 className="text-sm font-semibold text-black mb-3">Role Distribution</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="text-center">
              <div className="text-lg font-semibold text-black">{roleStats.super_admin}</div>
              <div className="text-xs" style={{ color: '#6b6b6b' }}>Super Admin</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-black">{roleStats.institute_admin}</div>
              <div className="text-xs" style={{ color: '#6b6b6b' }}>Institute Admin</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-black">{roleStats.exam_admin}</div>
              <div className="text-xs" style={{ color: '#6b6b6b' }}>Exam Admin</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-black">{roleStats.teacher}</div>
              <div className="text-xs" style={{ color: '#6b6b6b' }}>Teachers</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-black">{roleStats.student}</div>
              <div className="text-xs" style={{ color: '#6b6b6b' }}>Students</div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-600 dark:text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 text-sm border border-slate-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none bg-white dark:bg-gray-700 text-black dark:text-gray-100"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-2 px-3 py-2 text-sm border border-slate-200 dark:border-gray-600 rounded-lg transition-colors ${
                showFilters 
                  ? 'bg-teal-700 dark:bg-teal-600 text-white border-teal-700 dark:border-teal-600' 
                  : 'bg-white dark:bg-gray-800 text-slate-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-medium text-slate-600 dark:text-gray-400">Role:</span>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="ml-2 px-2 py-1 text-xs border border-slate-200 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none bg-white dark:bg-gray-700 text-black dark:text-gray-100"
                  >
                    <option value="all">All Roles</option>
                    <option value="super_admin">Super Admin</option>
                    <option value="institute_admin">Institute Admin</option>
                    <option value="exam_admin">Exam Admin</option>
                    <option value="teacher">Teacher</option>
                    <option value="student">Student</option>
                  </select>
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-600 dark:text-gray-400">Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="ml-2 px-2 py-1 text-xs border border-slate-200 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none bg-white dark:bg-gray-700 text-black dark:text-gray-100"
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
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-gray-300">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-gray-300">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-gray-300">Institute</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-gray-300">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-gray-300">Last Login</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-gray-700">
                {filteredUsers.map((userData) => (
                  <tr key={userData.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                          <UsersIcon className="w-4 h-4 text-slate-600 dark:text-gray-400" />
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
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white`}
                      style={{
                        backgroundColor: userData.role === 'super_admin' ? '#216865' :
                        userData.role === 'institute_admin' ? '#3f5fd4' :
                        userData.role === 'exam_admin' ? '#723e11' :
                        userData.role === 'teacher' ? '#216865' :
                        '#3f5fd4'
                      }}>
                        {getRoleIcon(userData.role)}
                        {userData.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-black dark:text-gray-100">{userData.institute?.name || 'N/A'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white`}
                        style={{
                          backgroundColor: userData.is_active ? '#216865' : '#6b6b6b'
                        }}>
                          {userData.is_active ? <CheckCircle className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                          {userData.is_active ? 'Active' : 'Inactive'}
                        </span>
                        {!userData.is_verified && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: '#723e11' }}>
                            <Clock className="w-3 h-3" />
                            Pending
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-black dark:text-gray-100">
                        {userData.last_login ? new Date(userData.last_login).toLocaleDateString() : 'Never'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openViewModal(userData.id)}
                          className="p-1 rounded transition-colors hover:bg-gray-100 dark:hover:bg-gray-600 text-blue-600 dark:text-blue-400"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(userData.id)}
                          className="p-1 rounded transition-colors hover:bg-gray-100 dark:hover:bg-gray-600 text-slate-600 dark:text-gray-400"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(userData)}
                          className="p-1 rounded transition-colors hover:bg-gray-100 dark:hover:bg-gray-600 text-slate-600 dark:text-gray-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600 text-slate-600 dark:text-gray-400">
                          <MoreVertical className="w-4 h-4" />
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
    {(viewModalOpen || editModalOpen || deleteModalOpen || inviteModalOpen) && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
        <div className="relative w-full max-w-lg rounded-xl bg-white shadow-xl">
          <button
            onClick={closeModals}
            className="absolute top-3 right-3 p-1 rounded-full text-slate-500 hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

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
