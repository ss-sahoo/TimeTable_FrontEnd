import { useState, useEffect } from "react";
import { api } from "../../hooks/useApi";
import { useAuthContext } from "../../contexts/AuthContext";
import StatsCard from "./StatsCard";
import LineChart from "./LineChart";
import { Building, Users, FileText, Activity, Clock, Loader2, MapPin } from "lucide-react";

interface ActivityItem {
  id: string | number;
  type: 'exam' | 'user' | 'institute';
  title: string;
  institute: string;
  time: string;
  status: string;
}

interface ChartDataPoint {
  label: string;
  value: number;
}

const DashboardContent = () => {
  const { user } = useAuthContext();
  const [stats, setStats] = useState({
    totalCenters: 0,
    totalStudents: 0,
    totalExams: 0,
    systemUptime: "99.9%",
  });
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const instituteId = user?.institute_id || user?.institute?.id;

      if (!instituteId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const [centersRes, usersRes, examsRes] = await Promise.all([
          api.get(`/timetable/centers/?institute_id=${instituteId}`),
          api.get(`/auth/users/?institute_id=${instituteId}`),
          api.get(`/exams/exams/?institute_id=${instituteId}`),
        ]);

        const centers = centersRes.data.results || centersRes.data;
        const users = usersRes.data.results || usersRes.data;
        const exams = examsRes.data.results || examsRes.data;

        const studentsCount = Array.isArray(users)
          ? users.filter((u: any) => u.role?.toLowerCase() === 'student').length
          : 0;

        setStats({
          totalCenters: Array.isArray(centers) ? centers.length : 0,
          totalStudents: studentsCount,
          totalExams: Array.isArray(exams) ? exams.length : 0,
          systemUptime: "99.9%",
        });

        // Generate Chart Data (Exams per month for last 6 months)
        if (Array.isArray(exams)) {
          const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          const last6Months = [];
          const now = new Date();

          for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            last6Months.push({
              label: months[d.getMonth()],
              month: d.getMonth(),
              year: d.getFullYear(),
              value: 0
            });
          }

          exams.forEach((exam: any) => {
            if (exam.created_at) {
              const createdDate = new Date(exam.created_at);
              const monthIdx = last6Months.findIndex(m => m.month === createdDate.getMonth() && m.year === createdDate.getFullYear());
              if (monthIdx !== -1) {
                last6Months[monthIdx].value += 1;
              }
            }
          });

          setChartData(last6Months.map(m => ({ label: m.label, value: m.value })));
        }

        // Generate recent activities from fetched data
        const activities: ActivityItem[] = [];

        if (Array.isArray(exams)) {
          exams.slice(0, 2).forEach((exam: any) => {
            activities.push({
              id: `exam-${exam.id}`,
              type: 'exam',
              title: exam.title,
              institute: exam.institute_name || 'Platform',
              time: exam.created_at ? new Date(exam.created_at).toLocaleDateString() : 'Recently',
              status: exam.status || 'created'
            });
          });
        }

        if (Array.isArray(users)) {
          users.slice(0, 1).forEach((user: any) => {
            activities.push({
              id: `user-${user.id}`,
              type: 'user',
              title: `New User: ${user.username}`,
              institute: user.institute_name || 'Platform',
              time: 'Recently',
              status: 'joined'
            });
          });
        }

        if (Array.isArray(centers)) {
          centers.slice(0, 1).forEach((center: any) => {
            activities.push({
              id: `center-${center.id}`,
              type: 'institute',
              title: center.name,
              institute: center.city || 'New Center',
              time: 'Recently',
              status: 'verified'
            });
          });
        }

        setRecentActivities(activities.sort((a, b) => String(b.id).localeCompare(String(a.id))));

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.institute_id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-slate-500 dark:text-gray-400 font-medium animate-pulse">Loading dashboard analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-10">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            {user?.institute?.name || user?.institute_name || 'Institute'} Overview
          </h2>
          <p className="text-slate-500 dark:text-gray-400 mt-1 font-medium">Real-time analytics for {user?.institute?.name || user?.institute_name || 'your institute'}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex -space-x-3">
            {[1, 2, 3, 4].map((i) => (
              <img
                key={i}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white dark:border-gray-800 object-cover"
                src={`https://i.pravatar.cc/150?u=${i}`}
                alt="User"
              />
            ))}
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white dark:border-gray-800 bg-blue-600 flex items-center justify-center text-white text-[10px] sm:text-xs font-bold">+{stats.totalCenters > 4 ? stats.totalCenters - 4 : 0}</div>
          </div>
          <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-gray-400 ml-2">Active admins online</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatsCard
          title="Total Centers"
          value={stats.totalCenters.toString()}
          icon={MapPin}
          color="bg-blue-600"
          trend={{ value: "Live", isUp: true }}
        />
        <StatsCard
          title="Total Students"
          value={stats.totalStudents.toLocaleString()}
          icon={Users}
          color="bg-emerald-600"
          trend={{ value: "Active", isUp: true }}
        />
        <StatsCard
          title="Exams Conducted"
          value={stats.totalExams.toLocaleString()}
          icon={FileText}
          color="bg-amber-500"
          trend={{ value: "Total", isUp: true }}
        />
        <StatsCard
          title="System Uptime"
          value={stats.systemUptime}
          icon={Activity}
          color="bg-indigo-600"
          trend={{ value: "Stable", isUp: true }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Chart Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Growth Analytics</h3>
                <p className="text-sm text-slate-500 dark:text-gray-400">Exam creation trends over the last 6 months</p>
              </div>
              <select className="bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-gray-100 transition-all">
                <option>Last 6 Months</option>
                <option>Last Year</option>
              </select>
            </div>
            <LineChart data={chartData} height={300} />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Recent Activity</h3>
            <button className="text-blue-600 dark:text-blue-400 text-sm font-bold hover:underline">View All</button>
          </div>
          <div className="space-y-6">
            {recentActivities.length > 0 ? recentActivities.map((activity) => (
              <div key={activity.id} className="flex gap-4 group cursor-pointer">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-300 ${activity.type === 'exam' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                  activity.type === 'user' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' :
                    'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                  }`}>
                  {activity.type === 'exam' ? <FileText size={18} /> :
                    activity.type === 'user' ? <Users size={18} /> :
                      <Building size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{activity.title}</h4>
                  <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">{activity.institute}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Clock size={12} className="text-slate-400 dark:text-gray-500" />
                    <span className="text-[10px] font-medium text-slate-400 dark:text-gray-500 uppercase tracking-wider">{activity.time}</span>
                  </div>
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Activity className="w-10 h-10 text-slate-200 dark:text-gray-700 mb-2" />
                <p className="text-xs text-slate-400 dark:text-gray-500">No recent activity found</p>
              </div>
            )}
          </div>

          <div className="mt-10 p-6 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl text-white relative overflow-hidden">
            <div className="relative z-10">
              <h4 className="font-bold text-lg">System Health</h4>
              <p className="text-blue-100 text-xs mt-1">All services are running smoothly</p>
              <button className="mt-4 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border border-white/30 px-4 py-2 rounded-xl text-xs font-bold transition-all">
                Check Status
              </button>
            </div>
            <Activity className="absolute -right-4 -bottom-4 w-24 h-24 text-white/10 rotate-12" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardContent;
