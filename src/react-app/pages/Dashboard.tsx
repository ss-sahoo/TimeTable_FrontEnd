import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import {
  BookOpen,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Eye,
  Calendar,
  BarChart3,
  Building2,
  UserCheck,
  Shield,
  Zap,
  User,
  X,
} from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { useApi, api } from '../hooks/useApi';
import { SkeletonDashboard } from '../components/SkeletonLoader';

// Interfaces
interface DashboardStats {
  total_exams: number;
  active_exams: number;
  published_exams: number;
  draft_exams: number;
  total_students: number;
  total_attempts: number;
  completed_attempts: number;
  in_progress_attempts: number;
  disqualified_attempts: number;
  average_score: number;
  total_violations: number;
  total_questions: number;
  verified_questions: number;
}

interface RecentExam {
  id: number;
  title: string;
  status: string;
  start_date: string;
  total_questions: number;
  total_marks: number;
}

interface AdminDashboardData {
  stats: DashboardStats;
  recent_exams: RecentExam[];
  recent_attempts: any[];
  institute: { id: number; name: string; };
}

interface Center {
  id: string;
  name: string;
  city?: string;
  address?: string;
  institute?: { id: string; name: string; };
  created_at?: string;
}

interface CenterUser {
  id: number | string;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  phone?: string;
  role: string;
  teacher_code?: string;
}

export default function Dashboard() {
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState<'profile' | 'peoples'>('profile');
  const [centerId, setCenterId] = useState<string | null>(null);

  // Fetch dashboard data
  const { data: dashboardData, loading, error } = useApi<AdminDashboardData>('/exams/admin-dashboard/');

  // Get center_id from user or fetch from profile
  useEffect(() => {
    const getCenterId = async () => {
      if (user?.center_id) {
        setCenterId(user.center_id);
      } else {
        try {
          const response = await api.get('/auth/profile/');
          if (response.data?.center_id) {
            setCenterId(response.data.center_id);
          }
        } catch (err) {
          console.error("Failed to fetch center_id:", err);
        }
      }
    };
    getCenterId();
  }, [user]);

  const stats = dashboardData?.stats || {
    total_exams: 0, active_exams: 0, total_students: 0, total_attempts: 0,
    completed_attempts: 0, average_score: 0, total_violations: 0, total_questions: 0,
  };
  const recentExams = dashboardData?.recent_exams || [];
  const institute = dashboardData?.institute;

  if (loading) return <SkeletonDashboard />;

  if (error) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-gray-100 mb-2">Error Loading Dashboard</h1>
        <p className="text-slate-600 dark:text-gray-400 mb-6">{error}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Welcome Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-slate-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-gray-100 mb-2">
              Welcome back, {user?.first_name || 'Admin'}!
            </h1>
            <p className="text-sm text-slate-600 dark:text-gray-400">Here's what's happening with your exams today.</p>
          </div>
          <div className="hidden sm:block w-16 h-16 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>

      {/* Institute Info */}
      {institute && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-gray-100">{institute.name}</h2>
                <p className="text-sm text-slate-600 dark:text-gray-400">Your Institute</p>
              </div>
            </div>
            <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
              <Shield className="w-3 h-3" /> Active
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatMini icon={UserCheck} label="Total Students" value={stats.total_students} color="green" />
            <StatMini icon={BookOpen} label="Total Exams" value={stats.total_exams} color="purple" />
            <StatMini icon={TrendingUp} label="Total Attempts" value={stats.total_attempts} color="orange" />
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Exams" value={stats.total_exams} icon={BookOpen} color="blue" />
        <StatCard label="Active Exams" value={stats.active_exams} icon={Clock} color="green" />
        <StatCard label="Total Students" value={stats.total_students} icon={Users} color="orange" />
        <StatCard label="Completed Attempts" value={stats.completed_attempts} icon={CheckCircle} color="purple" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Attempts" value={stats.total_attempts} icon={TrendingUp} color="indigo" />
        <StatCard label="Average Score" value={`${stats.average_score}%`} icon={BarChart3} color="emerald" />
        <StatCard label="Total Questions" value={stats.total_questions} icon={BookOpen} color="cyan" />
        <StatCard label="Violations" value={stats.total_violations} icon={AlertCircle} color="red" />
      </div>

      {/* Profile/Peoples Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-1.5">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'profile' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-700'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('peoples')}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'peoples' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-700'
            }`}
          >
            Peoples
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && <ProfileTab centerId={centerId} />}
      {activeTab === 'peoples' && <PeoplesTab centerId={centerId} />}

      {/* Recent Exams & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm">
            <div className="p-5 border-b border-slate-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-gray-100">Recent Exams</h2>
              <Link to="/exams" className="text-sm text-blue-600 hover:text-blue-700 font-medium">View all</Link>
            </div>
            <div className="p-5 space-y-3">
              {recentExams.length > 0 ? recentExams.map((exam) => (
                <div key={exam.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-gray-900 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-slate-900 dark:text-gray-100">{exam.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(exam.status)}`}>{exam.status}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-gray-400">
                      <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{formatDate(exam.start_date)}</span>
                      <span>{exam.total_questions} questions</span>
                      <span>{exam.total_marks} marks</span>
                    </div>
                  </div>
                  <Link to={`/exams/${exam.id}`} className="p-2 text-slate-400 hover:text-slate-600"><Eye className="w-4 h-4" /></Link>
                </div>
              )) : (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600 dark:text-gray-400">No recent exams</p>
                </div>
              )}
            </div>
          </div>
        </div>
        <QuickActions />
      </div>
    </div>
  );
}


// Helper functions
function getStatusColor(status: string) {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-700';
    case 'published': return 'bg-blue-100 text-blue-700';
    case 'draft': return 'bg-yellow-100 text-yellow-700';
    default: return 'bg-slate-100 text-slate-700';
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Stat Card Component
function StatCard({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: React.ComponentType<{ className?: string }>; color: string }) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-600', green: 'bg-green-600', orange: 'bg-orange-600', purple: 'bg-purple-600',
    indigo: 'bg-indigo-600', emerald: 'bg-emerald-600', cyan: 'bg-cyan-600', red: 'bg-red-600',
  };
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-slate-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-600 dark:text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-gray-100 mt-1">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl ${colorClasses[color]} flex items-center justify-center shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

// Mini Stat Component
function StatMini({ icon: Icon, label, value, color }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number; color: string }) {
  const colorClasses: Record<string, string> = { green: 'bg-green-100 text-green-600', purple: 'bg-purple-100 text-purple-600', orange: 'bg-orange-100 text-orange-600' };
  return (
    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-gray-900 rounded-lg">
      <div className={`w-8 h-8 ${colorClasses[color]} rounded-lg flex items-center justify-center`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-xs text-slate-600 dark:text-gray-400">{label}</p>
        <p className="text-sm font-medium text-slate-900 dark:text-gray-100">{value}</p>
      </div>
    </div>
  );
}

// Quick Actions Component
function QuickActions() {
  const { user } = useAuthContext();
  const actions = [
    { title: 'Create New Exam', description: 'Set up a new examination', icon: Plus, href: '/exams/create', color: 'bg-blue-600' },
    { title: 'Create Pattern', description: 'Define exam structure', icon: Zap, href: '/patterns/create', color: 'bg-blue-600' },
    { title: 'Add Questions', description: 'Add to question bank', icon: BookOpen, href: '/questions/create', color: 'bg-blue-600' },
    { title: 'View Analytics', description: 'Check performance', icon: BarChart3, href: '/analytics', color: 'bg-blue-600' },
  ];
  if (user?.role === 'super_admin' || user?.role === 'institute_admin') {
    actions.push({ title: 'Manage Users', description: 'View and manage users', icon: Users, href: '/users', color: 'bg-blue-600' });
  }
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm">
      <div className="p-5 border-b border-slate-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-gray-100">Quick Actions</h2>
      </div>
      <div className="p-5 space-y-3">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Link key={index} to={action.href} className="block p-3 bg-slate-50 dark:bg-gray-900 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-transparent transition-all">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center shadow-md`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-gray-100">{action.title}</h3>
                  <p className="text-xs text-slate-600 dark:text-gray-400">{action.description}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}


// Profile Tab Component
function ProfileTab({ centerId }: { centerId: string | null }) {
  const { data: centerData, loading, error } = useApi<Center>(centerId ? `/timetable/centers/${centerId}/` : '');

  if (!centerId) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-6">
        <div className="text-center py-8">
          <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-gray-400">No center assigned to your profile</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-gray-400">Loading center details...</p>
        </div>
      </div>
    );
  }

  if (error || !centerData) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-6">
        <div className="text-center py-8">
          <X className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-600 mb-2">Failed to load center details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
          <Building2 className="w-8 h-8 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-gray-100">{centerData.name}</h2>
          {centerData.institute && <p className="text-slate-500 dark:text-gray-400">{centerData.institute.name}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-500 dark:text-gray-400 block mb-1">Center Name</label>
            <p className="text-base text-slate-900 dark:text-gray-100 font-medium">{centerData.name}</p>
          </div>
          {centerData.city && (
            <div>
              <label className="text-sm font-medium text-slate-500 dark:text-gray-400 block mb-1">City</label>
              <p className="text-base text-slate-900 dark:text-gray-100">{centerData.city}</p>
            </div>
          )}
          {centerData.address && (
            <div>
              <label className="text-sm font-medium text-slate-500 dark:text-gray-400 block mb-1">Address</label>
              <p className="text-base text-slate-900 dark:text-gray-100">{centerData.address}</p>
            </div>
          )}
        </div>
        <div className="space-y-4">
          {centerData.institute && (
            <div>
              <label className="text-sm font-medium text-slate-500 dark:text-gray-400 block mb-1">Institute</label>
              <p className="text-base text-slate-900 dark:text-gray-100">{centerData.institute.name}</p>
            </div>
          )}
          {centerData.id && (
            <div>
              <label className="text-sm font-medium text-slate-500 dark:text-gray-400 block mb-1">Center ID</label>
              <p className="text-base text-slate-900 dark:text-gray-100 font-mono text-sm">{centerData.id}</p>
            </div>
          )}
          {centerData.created_at && (
            <div>
              <label className="text-sm font-medium text-slate-500 dark:text-gray-400 block mb-1">Created At</label>
              <p className="text-base text-slate-900 dark:text-gray-100">{new Date(centerData.created_at).toLocaleDateString()}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// Peoples Tab Component
function PeoplesTab({ centerId }: { centerId: string | null }) {
  const { user } = useAuthContext();
  const [teachers, setTeachers] = useState<CenterUser[]>([]);
  const [admins, setAdmins] = useState<CenterUser[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [showCreateTeacherModal, setShowCreateTeacherModal] = useState(false);
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    const fetchUsers = async () => {
      if (!centerId) return;

      setLoadingTeachers(true);
      try {
        const res = await api.get(`/timetable/centers/${centerId}/users/?role=teacher`);
        const data = res.data?.results || res.data || [];
        setTeachers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching teachers:", err);
        setTeachers([]);
      } finally {
        setLoadingTeachers(false);
      }

      setLoadingAdmins(true);
      try {
        const res = await api.get(`/timetable/centers/${centerId}/users/?role=ADMIN`);
        const data = res.data?.results || res.data || [];
        setAdmins(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching admins:", err);
        setAdmins([]);
      } finally {
        setLoadingAdmins(false);
      }
    };
    fetchUsers();
  }, [centerId, refetchTrigger]);

  const handleRefetch = () => setRefetchTrigger(prev => prev + 1);

  if (!centerId) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-6">
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-gray-400">No center assigned to view peoples</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Teachers Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-gray-100">Teachers ({teachers.length})</h3>
          </div>
          <button
            onClick={() => setShowCreateTeacherModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 shadow-md"
          >
            <Plus className="w-4 h-4" /> Create Teacher
          </button>
        </div>

        {loadingTeachers ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
            <p className="text-sm text-slate-500 dark:text-gray-400">Loading teachers...</p>
          </div>
        ) : teachers.length === 0 ? (
          <div className="text-center py-8">
            <User className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500 dark:text-gray-400">No teachers found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {teachers.map((teacher) => (
              <div key={teacher.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-gray-900 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-gray-100">
                      {teacher.full_name || `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim() || teacher.username}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-gray-400">{teacher.email}</p>
                  </div>
                </div>
                <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded">Teacher</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Admins Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-gray-100">Admins ({admins.length})</h3>
          </div>
          {isSuperAdmin && (
            <button
              onClick={() => setShowCreateAdminModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-md"
            >
              <Plus className="w-4 h-4" /> Create Admin
            </button>
          )}
        </div>

        {loadingAdmins ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-slate-500 dark:text-gray-400">Loading admins...</p>
          </div>
        ) : admins.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500 dark:text-gray-400">No admins found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {admins.map((admin) => (
              <div key={admin.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-gray-900 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <Shield className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-gray-100">
                      {admin.full_name || `${admin.first_name || ''} ${admin.last_name || ''}`.trim() || admin.username}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-gray-400">{admin.email}</p>
                  </div>
                </div>
                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded">Admin</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateTeacherModal && (
        <CreateTeacherModal centerId={centerId} onClose={() => setShowCreateTeacherModal(false)} onSuccess={() => { setShowCreateTeacherModal(false); handleRefetch(); }} />
      )}
      {showCreateAdminModal && isSuperAdmin && (
        <CreateAdminModal centerId={centerId} onClose={() => setShowCreateAdminModal(false)} onSuccess={() => { setShowCreateAdminModal(false); handleRefetch(); }} />
      )}
    </div>
  );
}


// Create Teacher Modal
function CreateTeacherModal({ centerId, onClose, onSuccess }: { centerId: string | null; onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({ name: '', email: '', phone_number: '', employee_id: '', subjects: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [createdUser, setCreatedUser] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!centerId) { setError('Center ID is required'); return; }
    setLoading(true);
    setError(null);
    try {
      const payload: any = { name: formData.name, email: formData.email, phone_number: formData.phone_number };
      if (formData.employee_id) payload.employee_id = formData.employee_id;
      if (formData.subjects) payload.subjects = formData.subjects;
      const response = await api.post('/timetable/admin/teachers/create/', payload);
      setCreatedUser(response.data);
      setSuccess(true);
      setTimeout(onSuccess, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to create teacher');
    } finally {
      setLoading(false);
    }
  };

  if (success && createdUser) {
    return (
      <Modal title="Teacher Created Successfully" onClose={onClose}>
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <p className="text-sm text-green-800 dark:text-green-400 font-medium mb-2">Teacher created!</p>
          {createdUser.username && <p className="text-sm"><strong>Username:</strong> {createdUser.username}</p>}
          {createdUser.password && <p className="text-sm"><strong>Password:</strong> {createdUser.password}</p>}
          {createdUser.teacher_code && <p className="text-sm"><strong>Teacher Code:</strong> {createdUser.teacher_code}</p>}
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="Create Teacher" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"><p className="text-sm text-red-600 dark:text-red-400">{error}</p></div>}
        <Input label="Name *" value={formData.name} onChange={(v) => setFormData({ ...formData, name: v })} required />
        <Input label="Email *" type="email" value={formData.email} onChange={(v) => setFormData({ ...formData, email: v })} required />
        <Input label="Phone Number *" value={formData.phone_number} onChange={(v) => setFormData({ ...formData, phone_number: v })} required />
        <Input label="Employee ID" value={formData.employee_id} onChange={(v) => setFormData({ ...formData, employee_id: v })} />
        <Input label="Subjects" value={formData.subjects} onChange={(v) => setFormData({ ...formData, subjects: v })} placeholder="Physics, Chemistry" />
        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-600" disabled={loading}>Cancel</button>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50" disabled={loading}>{loading ? 'Creating...' : 'Create Teacher'}</button>
        </div>
      </form>
    </Modal>
  );
}

// Create Admin Modal
function CreateAdminModal({ centerId, onClose, onSuccess }: { centerId: string | null; onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({ name: '', email: '', phone_number: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [createdUser, setCreatedUser] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!centerId) { setError('Center ID is required'); return; }
    setLoading(true);
    setError(null);
    try {
      const payload = { center_id: centerId, name: formData.name, email: formData.email, phone_number: formData.phone_number };
      const response = await api.post('/timetable/superadmin/admins/create/', payload);
      setCreatedUser(response.data);
      setSuccess(true);
      setTimeout(onSuccess, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to create admin');
    } finally {
      setLoading(false);
    }
  };

  if (success && createdUser) {
    return (
      <Modal title="Admin Created Successfully" onClose={onClose}>
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <p className="text-sm text-green-800 dark:text-green-400 font-medium mb-2">Admin created!</p>
          {createdUser.username && <p className="text-sm"><strong>Username:</strong> {createdUser.username}</p>}
          {createdUser.password && <p className="text-sm"><strong>Password:</strong> {createdUser.password}</p>}
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="Create Admin" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"><p className="text-sm text-red-600 dark:text-red-400">{error}</p></div>}
        <Input label="Name *" value={formData.name} onChange={(v) => setFormData({ ...formData, name: v })} required />
        <Input label="Email *" type="email" value={formData.email} onChange={(v) => setFormData({ ...formData, email: v })} required />
        <Input label="Phone Number *" value={formData.phone_number} onChange={(v) => setFormData({ ...formData, phone_number: v })} required />
        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-600" disabled={loading}>Cancel</button>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50" disabled={loading}>{loading ? 'Creating...' : 'Create Admin'}</button>
        </div>
      </form>
    </Modal>
  );
}

// Modal Component
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white dark:bg-gray-800 px-6 py-4 border-b border-slate-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-gray-100">{title}</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-500"><X className="w-5 h-5" /></button>
          </div>
          <div className="bg-white dark:bg-gray-800 px-6 py-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

// Input Component
function Input({ label, value, onChange, type = 'text', required = false, placeholder = '' }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; placeholder?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-slate-900 dark:text-gray-100"
      />
    </div>
  );
}
