import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Building2, Shield, Zap, User, X, Calendar, Upload,
} from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { api } from '../hooks/useApi';
import BulkTeacherUpload from '../components/BulkTeacherUpload';

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
        } catch {}
      }
    };
    getCenterId();
  }, [user]);

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'peoples' as const, label: 'Peoples', icon: Users },
  ];

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-1">
        <div className="flex gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
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
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-6 text-center">
        <div className="w-12 h-12 bg-slate-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
          <Building2 className="w-6 h-6 text-slate-400" />
        </div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-gray-100 mb-1">No Center Assigned</h3>
        <p className="text-xs text-slate-500 dark:text-gray-400">Contact your administrator to get assigned to a center</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !centerData) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 text-center">
        <X className="w-8 h-8 text-red-400 mx-auto mb-2" />
        <p className="text-sm text-red-600 dark:text-red-400">Failed to load center details</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-5 text-white">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">{centerData.name}</h1>
            {centerData.institute && <p className="text-blue-100 text-sm">{centerData.institute.name}</p>}
          </div>
        </div>
      </div>

      {/* Profile Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-gray-100 mb-3 flex items-center gap-2">
            <div className="w-1 h-4 bg-blue-600 rounded-full" />
            Center Information
          </h3>
          <div className="space-y-3">
            <InfoRow icon={Building2} label="Center Name" value={centerData.name} />
            {centerData.city && <InfoRow icon={Building2} label="City" value={centerData.city} />}
            {centerData.address && <InfoRow icon={Building2} label="Address" value={centerData.address} />}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-gray-100 mb-3 flex items-center gap-2">
            <div className="w-1 h-4 bg-blue-600 rounded-full" />
            Additional Details
          </h3>
          <div className="space-y-3">
            {centerData.institute && <InfoRow icon={Shield} label="Institute" value={centerData.institute.name} />}
            {centerData.id && <InfoRow icon={Zap} label="Center ID" value={centerData.id} mono />}
            {centerData.created_at && <InfoRow icon={Calendar} label="Created" value={new Date(centerData.created_at).toLocaleDateString()} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, mono }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center gap-3 p-2.5 bg-slate-50 dark:bg-gray-900/50 rounded-lg">
      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
        <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
      </div>
      <div>
        <p className="text-xs text-slate-500 dark:text-gray-400">{label}</p>
        <p className={`text-sm text-slate-900 dark:text-gray-100 ${mono ? 'font-mono text-xs' : 'font-medium'}`}>{value}</p>
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
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search by name, email, or username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 dark:border-gray-600 rounded-lg bg-slate-50 dark:bg-gray-900 text-slate-900 dark:text-gray-100"
            />
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 dark:border-gray-600 rounded-lg bg-slate-50 dark:bg-gray-900 text-slate-900 dark:text-gray-100"
          >
            <option value="">All Roles</option>
            {roles.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label} ({roleCounts[role.value] || 0})
              </option>
            ))}
          </select>
          {isAdmin && (
            <button
              onClick={() => setShowBulkUpload(true)}
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Bulk Upload
            </button>
          )}
        </div>
      </div>

      {/* Role Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {roles.map((role) => {
          const count = roleCounts[role.value] || 0;
          const isSelected = selectedRole === role.value;
          return (
            <button
              key={role.value}
              onClick={() => setSelectedRole(isSelected ? '' : role.value)}
              className={`p-3 rounded-lg border text-center transition-all ${
                isSelected
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-700 hover:border-blue-400'
              }`}
            >
              <p className={`text-lg font-semibold ${isSelected ? 'text-white' : 'text-slate-900 dark:text-gray-100'}`}>{count}</p>
              <p className={`text-xs ${isSelected ? 'text-blue-100' : 'text-slate-500 dark:text-gray-400'}`}>{role.label}</p>
            </button>
          );
        })}
      </div>


      {/* People List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700">
        <div className="p-4 border-b border-slate-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-gray-100">
                {selectedRole ? roles.find(r => r.value === selectedRole)?.label || 'People' : 'All People'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-gray-400">{pagination.totalCount} total</p>
            </div>
          </div>
        </div>

        <div className="p-3">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : people.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500 dark:text-gray-400">No people found</p>
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
            <div className="space-y-2">
              {people.map((person) => {
                const name = person.full_name || `${person.first_name || ''} ${person.last_name || ''}`.trim() || person.username;
                const RoleIcon = getRoleIcon(person.role);
                return (
                  <motion.div
                    key={person.id}
                    whileHover={{ x: 2 }}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-gray-900/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-semibold">
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-gray-100">{name}</p>
                        <p className="text-xs text-slate-500 dark:text-gray-400">{person.email}</p>
                        {person.teacher_code && (
                          <p className="text-xs text-slate-400 dark:text-gray-500 font-mono">{person.teacher_code}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${getRoleColor(person.role)}`}>
                        <RoleIcon className="w-3 h-3" />
                        {person.role_display || person.role}
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
          <div className="p-3 border-t border-slate-200 dark:border-gray-700 flex items-center justify-between">
            <p className="text-xs text-slate-500 dark:text-gray-400">
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => fetchPeople(pagination.page - 1)}
                disabled={!pagination.hasPrevious}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-gray-600 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => fetchPeople(pagination.page + 1)}
                disabled={!pagination.hasNext}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-gray-600 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Upload Modal */}
      <BulkTeacherUpload
        isOpen={showBulkUpload}
        onClose={() => setShowBulkUpload(false)}
        onSuccess={() => fetchPeople(1)}
        centerId={centerId || undefined}
      />
    </div>
  );
}
