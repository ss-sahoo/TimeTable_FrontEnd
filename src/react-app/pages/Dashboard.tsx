import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Building2, Shield, User, X, Upload, UserPlus,
} from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { api } from '../hooks/useApi';
import BulkUserUpload from '../components/BulkUserUpload';
import AddTeacherModal from '../components/AddTeacherModal';

// Interfaces
interface Center {
  id: string; name: string; city?: string; address?: string;
  institute?: { id: string; name: string; }; created_at?: string;
}

interface CenterUser {
  id: number | string; username: string; email: string; first_name?: string;
  last_name?: string; full_name?: string; phone?: string; role: string; role_display?: string;
  teacher_code?: string; is_active?: boolean; is_verified?: boolean;
  institute_id?: number; institute_name?: string; center_id?: string; center_name?: string;
  profile_picture?: string; created_at?: string;
}

export default function Dashboard() {
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState<'profile' | 'peoples'>('profile');
  const [centerId, setCenterId] = useState<string | null>(null);

  useEffect(() => {
    const getCenterId = async () => {
      if (user?.center_id) setCenterId(user.center_id);
      else {
        try {
          const res = await api.get('/auth/profile/');
          if (res.data?.center_id) setCenterId(res.data.center_id);
        } catch { }
      }
    };
    getCenterId();
  }, [user]);

  const tabs = [
    { id: 'profile' as const, label: 'Profile Overview', icon: User },
    { id: 'peoples' as const, label: 'People & Roles', icon: Users },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header Section */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Center Dashboard</h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Manage center details, administrators, and users.</p>
      </div>

      {/* Modern Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-4 sm:space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors duration-200 ${
                  isActive
                    ? 'border-blue-600 text-blue-600 dark:text-blue-500'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {activeTab === 'profile' && <ProfileTab centerId={centerId} />}
        {activeTab === 'peoples' && <PeoplesTab centerId={centerId} />}
      </motion.div>
    </div>
  );
}


// Profile Tab
function ProfileTab({ centerId }: { centerId: string | null }) {
  const [centerData, setCenterData] = useState<Center | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!centerId) return;
    const fetchCenter = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/timetable/centers/${centerId}/`);
        setCenterData(res.data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchCenter();
  }, [centerId]);

  if (!centerId) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 sm:p-12 text-center">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
        </div>
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No Center Assigned</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Contact your administrator to get assigned to a center</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 sm:py-20">
        <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !centerData) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-8 text-center">
        <X className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <p className="text-sm text-red-600 dark:text-red-400">Failed to load center details</p>
      </div>
    );
  }

  const centerInitial = centerData.name.charAt(0).toUpperCase();

  return (
    <div className="space-y-6">
      {/* Center Header Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="h-24 sm:h-32 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
        <div className="px-4 sm:px-6 pb-6">
          <div className="flex items-end -mt-12 sm:-mt-12 mb-4">
            <div className="h-20 w-20 sm:h-24 sm:w-24 bg-white dark:bg-gray-800 rounded-xl p-1 shadow-md">
              <div className="h-full w-full bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 text-2xl sm:text-3xl font-bold">
                {centerInitial}
              </div>
            </div>
            <div className="ml-3 sm:ml-4 mb-1">
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{centerData.name}</h2>
              {centerData.institute && (
                <span className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">{centerData.institute.name}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Center Information */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">Center Information</h3>
            <Building2 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            <div className="group">
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Center Name</label>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-900/50 px-3 py-2 rounded-lg border border-transparent group-hover:border-gray-200 dark:group-hover:border-gray-600 transition-colors">
                {centerData.name}
              </div>
            </div>
            {(centerData.city || centerData.address) && (
              <div className="grid grid-cols-2 gap-4">
                {centerData.city && (
                  <div className="group">
                    <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">City</label>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-900/50 px-3 py-2 rounded-lg border border-transparent group-hover:border-gray-200 dark:group-hover:border-gray-600 transition-colors">
                      {centerData.city}
                    </div>
                  </div>
                )}
                {centerData.address && (
                  <div className="group">
                    <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Address</label>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-900/50 px-3 py-2 rounded-lg border border-transparent group-hover:border-gray-200 dark:group-hover:border-gray-600 transition-colors truncate">
                      {centerData.address}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* System Details */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">System Details</h3>
            <Shield className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            <div className="group">
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Center ID</label>
              <div className="flex items-center justify-between text-xs sm:text-sm font-mono text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700">
                <span className="truncate">{centerData.id}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(centerData.id)}
                  className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors ml-2"
                  title="Copy ID"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                  </svg>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {centerData.institute && (
                <div className="group">
                  <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Institute</label>
                  <div className="text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-2 rounded-lg border border-blue-100 dark:border-blue-800">
                    {centerData.institute.name}
                  </div>
                </div>
              )}
              {centerData.created_at && (
                <div className="group">
                  <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Created Date</label>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-900/50 px-3 py-2 rounded-lg border border-transparent">
                    {new Date(centerData.created_at).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


// Peoples Tab - Unified view with filters
interface PeopleResponse {
  users: CenterUser[];
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
  roles: { value: string; label: string }[];
  role_counts: Record<string, number>;
}

function PeoplesTab({ centerId }: { centerId: string | null }) {
  const { user } = useAuthContext();
  const [people, setPeople] = useState<CenterUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [roles, setRoles] = useState<{ value: string; label: string }[]>([]);
  const [roleCounts, setRoleCounts] = useState<Record<string, number>>({});
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalCount: 0, hasNext: false, hasPrevious: false });
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [bulkUploadRole, setBulkUploadRole] = useState<'teacher' | 'student' | 'staff'>('teacher');
  const [showAddTeacher, setShowAddTeacher] = useState(false);

  const isAdmin = user?.role === 'super_admin' || user?.role === 'SUPER_ADMIN' ||
    user?.role === 'institute_admin' || user?.role === 'ADMIN';

  const fetchPeople = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('page_size', '20');
      if (searchQuery) params.append('search', searchQuery);
      if (selectedRole) params.append('role', selectedRole);
      if (centerId) params.append('center_id', centerId);

      const res = await api.get<PeopleResponse>(`/auth/people/?${params.toString()}`);
      setPeople(res.data.users || []);
      setRoles(res.data.roles || []);
      setRoleCounts(res.data.role_counts || {});
      setPagination({
        page: res.data.page,
        totalPages: res.data.total_pages,
        totalCount: res.data.total_count,
        hasNext: res.data.has_next,
        hasPrevious: res.data.has_previous,
      });
    } catch (err) {
      console.error('Failed to fetch people:', err);
      setPeople([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeople(1);
  }, [searchQuery, selectedRole, centerId]);

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      super_admin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      SUPER_ADMIN: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      institute_admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      ADMIN: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      exam_admin: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
      teacher: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      student: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      STAFF: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
    };
    return colors[role] || 'bg-slate-100 text-slate-600 dark:bg-gray-700 dark:text-gray-400';
  };

  const getRoleIcon = (role: string) => {
    if (role.includes('admin') || role === 'ADMIN') return Shield;
    if (role === 'teacher') return User;
    if (role === 'student') return Users;
    return User;
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl border border-slate-200 dark:border-gray-700 p-3 sm:p-4">
        <div className="flex flex-col gap-2 sm:gap-3">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search by name, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 text-xs sm:text-sm border border-slate-200 dark:border-gray-600 rounded-lg bg-slate-50 dark:bg-gray-900 text-slate-900 dark:text-gray-100"
              />
              <Users className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
            </div>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm border border-slate-200 dark:border-gray-600 rounded-lg bg-slate-50 dark:bg-gray-900 text-slate-900 dark:text-gray-100"
            >
              <option value="">All Roles</option>
              {roles.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label} ({roleCounts[role.value] || 0})
                </option>
              ))}
            </select>
          </div>
          {isAdmin && (
            <div className="flex flex-col xs:flex-row gap-2">
              <button
                onClick={() => setShowAddTeacher(true)}
                className="flex-1 xs:flex-none px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-blue-700 flex items-center justify-center gap-1.5 sm:gap-2"
              >
                <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Add User</span>
              </button>
              <button
                onClick={() => {
                  setBulkUploadRole('teacher');
                  setShowBulkUpload(true);
                }}
                className="flex-1 xs:flex-none px-3 sm:px-4 py-2 sm:py-2.5 bg-green-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-green-700 flex items-center justify-center gap-1.5 sm:gap-2"
              >
                <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Bulk Upload</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Role Summary Cards */}
      <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-1.5 sm:gap-2">
        {roles.map((role) => {
          const count = roleCounts[role.value] || 0;
          const isSelected = selectedRole === role.value;
          return (
            <button
              key={role.value}
              onClick={() => setSelectedRole(isSelected ? '' : role.value)}
              className={`p-2 sm:p-3 rounded-md sm:rounded-lg border text-center transition-all ${isSelected
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-700 hover:border-blue-400'
                }`}
            >
              <p className={`text-sm sm:text-lg font-semibold ${isSelected ? 'text-white' : 'text-slate-900 dark:text-gray-100'}`}>{count}</p>
              <p className={`text-[10px] sm:text-xs truncate ${isSelected ? 'text-blue-100' : 'text-slate-500 dark:text-gray-400'}`}>{role.label}</p>
            </button>
          );
        })}
      </div>


      {/* People List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl border border-slate-200 dark:border-gray-700">
        <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-gray-100 truncate">
                {selectedRole ? roles.find(r => r.value === selectedRole)?.label || 'People' : 'All People'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-gray-400">{pagination.totalCount} total</p>
            </div>
          </div>
        </div>

        <div className="p-2 sm:p-3">
          {loading ? (
            <div className="flex justify-center py-6 sm:py-8">
              <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : people.length === 0 ? (
            <div className="text-center py-6 sm:py-8">
              <Users className="w-8 h-8 sm:w-10 sm:h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs sm:text-sm text-slate-500 dark:text-gray-400">No people found</p>
              {(searchQuery || selectedRole) && (
                <button
                  onClick={() => { setSearchQuery(''); setSelectedRole(''); }}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-700"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-1.5 sm:space-y-2">
              {people.map((person) => {
                const name = person.full_name || `${person.first_name || ''} ${person.last_name || ''}`.trim() || person.username;
                const RoleIcon = getRoleIcon(person.role);
                return (
                  <motion.div
                    key={person.id}
                    whileHover={{ x: 2 }}
                    className="flex items-center justify-between p-2 sm:p-3 bg-slate-50 dark:bg-gray-900/50 rounded-lg gap-2"
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs sm:text-sm font-semibold flex-shrink-0">
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-medium text-slate-900 dark:text-gray-100 truncate">{name}</p>
                        <p className="text-xs text-slate-500 dark:text-gray-400 truncate">{person.email}</p>
                        {person.teacher_code && (
                          <p className="text-xs text-slate-400 dark:text-gray-500 font-mono truncate">{person.teacher_code}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center flex-shrink-0">
                      <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-medium flex items-center gap-0.5 sm:gap-1 ${getRoleColor(person.role)}`}>
                        <RoleIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        <span className="hidden xs:inline">{person.role_display || person.role}</span>
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-2 sm:p-3 border-t border-slate-200 dark:border-gray-700 flex items-center justify-between">
            <p className="text-[10px] sm:text-xs text-slate-500 dark:text-gray-400">
              Page {pagination.page}/{pagination.totalPages}
            </p>
            <div className="flex gap-1.5 sm:gap-2">
              <button
                onClick={() => fetchPeople(pagination.page - 1)}
                disabled={!pagination.hasPrevious}
                className="px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium rounded-md sm:rounded-lg border border-slate-200 dark:border-gray-600 disabled:opacity-50"
              >
                Prev
              </button>
              <button
                onClick={() => fetchPeople(pagination.page + 1)}
                disabled={!pagination.hasNext}
                className="px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium rounded-md sm:rounded-lg border border-slate-200 dark:border-gray-600 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Upload Modal */}
      <BulkUserUpload
        isOpen={showBulkUpload}
        onClose={() => setShowBulkUpload(false)}
        onSuccess={() => fetchPeople(1)}
        centerId={centerId || undefined}
        defaultRole={bulkUploadRole}
      />

      {/* Add Teacher Modal */}
      <AddTeacherModal
        isOpen={showAddTeacher}
        onClose={() => setShowAddTeacher(false)}
        onSuccess={() => fetchPeople(1)}
        centerId={centerId || undefined}
      />
    </div>
  );
}
