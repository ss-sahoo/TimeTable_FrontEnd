import { Link } from 'react-router';
import { motion } from 'framer-motion';
import {
  BarChart3, Zap, BookOpen, Plus, Eye, Clock, CheckCircle,
  AlertCircle, Users, TrendingUp, Building2, UserCheck, ArrowUpRight,
} from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { useApi } from '../hooks/useApi';

interface DashboardStats {
  total_exams: number; active_exams: number; total_students: number; total_attempts: number;
  completed_attempts: number; average_score: number; total_violations: number; total_questions: number;
}

interface RecentExam {
  id: number; title: string; status: string; start_date: string; total_questions: number; total_marks: number;
}

interface AdminDashboardData {
  stats: DashboardStats; recent_exams: RecentExam[]; recent_attempts: any[];
  institute: { id: number; name: string; };
}

export default function StatisticsTab() {
  const { user } = useAuthContext();
  const { data: dashboardData, loading } = useApi<AdminDashboardData>('/exams/admin-dashboard/');

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const stats = dashboardData?.stats || { total_exams: 0, active_exams: 0, total_students: 0, total_attempts: 0, completed_attempts: 0, average_score: 0, total_violations: 0, total_questions: 0 };
  const recentExams = dashboardData?.recent_exams || [];
  const institute = dashboardData?.institute;

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Welcome Card */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-xs font-medium mb-1">Exam Statistics</p>
            <h1 className="text-xl font-semibold">Welcome back, {user?.first_name || 'Admin'}!</h1>
            <p className="text-blue-100 text-sm mt-1">Here's what's happening with your exams today.</p>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-6 h-6" />
          </div>
        </div>
      </div>


      {/* Institute Card */}
      {institute && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-gray-100">{institute.name}</h2>
                <p className="text-xs text-slate-500 dark:text-gray-400">Your Institute</p>
              </div>
            </div>
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              Active
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <MiniStat icon={UserCheck} label="Students" value={stats.total_students} />
            <MiniStat icon={BookOpen} label="Exams" value={stats.total_exams} />
            <MiniStat icon={TrendingUp} label="Attempts" value={stats.total_attempts} />
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Exams" value={stats.total_exams} icon={BookOpen} color="blue" />
        <StatCard label="Active Exams" value={stats.active_exams} icon={Clock} color="green" />
        <StatCard label="Students" value={stats.total_students} icon={Users} color="orange" />
        <StatCard label="Completed" value={stats.completed_attempts} icon={CheckCircle} color="purple" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Attempts" value={stats.total_attempts} icon={TrendingUp} color="indigo" />
        <StatCard label="Avg Score" value={`${stats.average_score}%`} icon={BarChart3} color="teal" />
        <StatCard label="Questions" value={stats.total_questions} icon={Zap} color="pink" />
        <StatCard label="Violations" value={stats.total_violations} icon={AlertCircle} color="red" />
      </div>

      {/* Recent Exams & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700">
          <div className="p-4 border-b border-slate-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-gray-100">Recent Exams</h2>
            <Link to="/exam?tab=exams" className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
              View all <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-3 space-y-2">
            {recentExams.length > 0 ? recentExams.slice(0, 4).map((exam) => (
              <motion.div key={exam.id} whileHover={{ x: 2 }} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-gray-900/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs font-semibold">
                    {exam.title.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-slate-900 dark:text-gray-100">{exam.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-gray-400">{exam.total_questions} questions • {formatDate(exam.start_date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusStyle(exam.status)}`}>{exam.status}</span>
                  <Link to={`/exams/${exam.id}`} className="p-1.5 hover:bg-slate-200 dark:hover:bg-gray-700 rounded"><Eye className="w-3.5 h-3.5 text-slate-400" /></Link>
                </div>
              </motion.div>
            )) : (
              <div className="text-center py-8">
                <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500">No recent exams</p>
              </div>
            )}
          </div>
        </div>
        <QuickActions />
      </div>
    </div>
  );
}


function StatCard({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: React.ComponentType<{ className?: string }>; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-600', green: 'bg-green-600', orange: 'bg-orange-500', purple: 'bg-purple-600',
    indigo: 'bg-indigo-600', teal: 'bg-teal-600', pink: 'bg-pink-600', red: 'bg-red-600',
  };
  return (
    <motion.div whileHover={{ y: -2 }} className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className={`w-9 h-9 ${colors[color]} rounded-lg flex items-center justify-center`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      <p className="text-xl font-semibold text-slate-900 dark:text-gray-100">{value}</p>
      <p className="text-xs text-slate-500 dark:text-gray-400">{label}</p>
    </motion.div>
  );
}

function MiniStat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number }) {
  return (
    <div className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-gray-900/50 rounded-lg">
      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
        <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-900 dark:text-gray-100">{value}</p>
        <p className="text-xs text-slate-500 dark:text-gray-400">{label}</p>
      </div>
    </div>
  );
}

function QuickActions() {
  const actions = [
    { title: 'Create Exam', icon: Plus, href: '/exams/create' },
    { title: 'New Pattern', icon: Zap, href: '/patterns/create' },
    { title: 'Add Questions', icon: BookOpen, href: '/questions/create' },
    { title: 'View Analytics', icon: BarChart3, href: '/analytics' },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700">
      <div className="p-4 border-b border-slate-200 dark:border-gray-700">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-gray-100">Quick Actions</h2>
      </div>
      <div className="p-3 space-y-2">
        {actions.map((action, i) => {
          const Icon = action.icon;
          return (
            <Link key={i} to={action.href}>
              <motion.div whileHover={{ x: 2 }} className="flex items-center gap-3 p-2.5 bg-slate-50 dark:bg-gray-900/50 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-gray-300">{action.title}</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 ml-auto" />
              </motion.div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function getStatusStyle(status: string) {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    case 'published': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    case 'draft': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    default: return 'bg-slate-100 text-slate-600 dark:bg-gray-700 dark:text-gray-400';
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
