import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  TrendingUp,
  CheckCircle,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
  Atom,
  Calculator,
  FlaskConical,
  GraduationCap,
  MoreVertical,
} from "lucide-react";
import { useAuthContext } from "../contexts/AuthContext";
import { api } from "../hooks/useApi";

export default function NewSuperAdminDashboard() {
  const { user, isAuthenticated, loading: authLoading } = useAuthContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login", { replace: true });
    }
    if (!authLoading && user?.role !== "super_admin" && user?.role !== "SUPER_ADMIN") {
      navigate("/dashboard", { replace: true });
    }
  }, [user, isAuthenticated, authLoading, navigate]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return <DashboardContent user={user} />;
}

// Dashboard Content Component
function DashboardContent({ user }: { user: any }) {
  const [stats, setStats] = useState({
    centers: 0,
    students: 0,
    exams: 0,
    teachers: 0,
    centersNew: 0,
    studentsGrowth: 0,
    examsThisYear: 0,
    completionRate: 0,
    uptime: 99.99,
    capacity: 0,
  });
  const [recentExams, setRecentExams] = useState<any[]>([]);
  const [, setTrafficData] = useState<any[]>([]);
  const [regionalStatus, setRegionalStatus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const instituteId = user?.institute_id || user?.institute?.id;
      if (!instituteId) {
        setLoading(false);
        return;
      }

      try {
        // Fetch analytics data
        const analyticsRes = await api.get(`/auth/analytics/dashboard/?institute_id=${instituteId}`);
        const analyticsData = analyticsRes.data;

        // Fetch exams for the table
        const examsRes = await api.get(`/exams/exams/?institute_id=${instituteId}`);
        const exams = examsRes.data?.results || examsRes.data || [];

        // Update stats from analytics
        setStats({
          centers: analyticsData.stats?.centers?.total || 0,
          centersNew: analyticsData.stats?.centers?.new_this_month || 0,
          students: analyticsData.stats?.students?.total || 0,
          studentsGrowth: analyticsData.stats?.students?.growth_percentage || 0,
          teachers: analyticsData.stats?.students?.teachers || 0,
          exams: analyticsData.stats?.exams?.total || 0,
          examsThisYear: analyticsData.stats?.exams?.this_year || 0,
          completionRate: analyticsData.stats?.exams?.completion_rate || 0,
          uptime: analyticsData.stats?.platform?.uptime || 99.99,
          capacity: analyticsData.stats?.centers?.capacity || 0,
        });

        // Set traffic and regional data
        setTrafficData(analyticsData.traffic || []);
        setRegionalStatus(analyticsData.regional_status || []);

        // Set recent exams
        if (Array.isArray(exams)) {
          setRecentExams(exams.slice(0, 5));
        }
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        // Fallback to old API if analytics fails
        try {
          const [centersRes, usersRes, examsRes] = await Promise.all([
            api.get(`/timetable/centers/?institute_id=${instituteId}`).catch(() => ({ data: [] })),
            api.get(`/auth/people/?institute_id=${instituteId}`).catch(() => ({ data: { users: [], role_counts: {} } })),
            api.get(`/exams/exams/?institute_id=${instituteId}`).catch(() => ({ data: [] })),
          ]);

          const centers = centersRes.data?.centers || centersRes.data || [];
          const usersData = usersRes.data;
          const exams = examsRes.data?.results || examsRes.data || [];

          const roleCounts = usersData?.role_counts || {};
          const studentCount = (roleCounts["student"] || 0) + (roleCounts["STUDENT"] || 0);
          const teacherCount = (roleCounts["teacher"] || 0) + (roleCounts["TEACHER"] || 0);

          setStats({
            centers: Array.isArray(centers) ? centers.length : 0,
            centersNew: 0,
            students: studentCount,
            studentsGrowth: 0,
            exams: Array.isArray(exams) ? exams.length : 0,
            examsThisYear: 0,
            teachers: teacherCount,
            completionRate: 85,
            uptime: 99.99,
            capacity: (Array.isArray(centers) ? centers.length : 0) * 300,
          });

          if (Array.isArray(exams)) {
            setRecentExams(exams.slice(0, 5));
          }
        } catch (fallbackError) {
          console.error("Fallback API also failed:", fallbackError);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user?.institute_id, user?.institute?.id]);

  const regions = regionalStatus.length > 0 ? regionalStatus : [
    { name: "Asia Pacific (Mumbai)", latency: "42ms", status: "operational" },
    { name: "Asia Pacific (Singapore)", latency: "86ms", status: "operational" },
    { name: "US East (N. Virginia)", latency: "140ms", status: "degraded" },
  ];

  return (
    <div className="space-y-6">
      {/* Page Heading & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <nav className="flex text-slate-500 text-xs font-medium mb-1">
            <span className="hover:text-slate-900 cursor-pointer">Home</span>
            <span className="mx-2 text-slate-300">/</span>
            <span className="hover:text-slate-900 cursor-pointer">Dashboards</span>
            <span className="mx-2 text-slate-300">/</span>
            <span className="text-slate-900 font-semibold">Overview</span>
          </nav>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Performance Monitor</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-medium">
            Last updated: <span className="text-slate-900">Just now</span>
          </span>
          <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors">
            <Download className="w-4 h-4" /> Export Report
          </button>
        </div>
      </div>

      {/* KPI METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <KPICard
          label="Total Centers"
          value={loading ? "..." : stats.centers.toString()}
          badge={stats.centersNew > 0 ? `+${stats.centersNew} new` : undefined}
          badgeColor="emerald"
          footer="100% Operational"
          footerDot="emerald"
        />
        <KPICard
          label="Active Students"
          value={loading ? "..." : stats.students.toLocaleString()}
          badge={stats.studentsGrowth > 0 ? `+${stats.studentsGrowth}%` : undefined}
          badgeColor="emerald"
          badgeIcon={stats.studentsGrowth > 0 ? <TrendingUp className="w-3 h-3" /> : undefined}
          footer={`${stats.teachers} teachers enrolled`}
        />
        <KPICard
          label="Exams Conducted"
          value={loading ? "..." : stats.exams.toString()}
          badge={stats.examsThisYear > 0 ? "This Year" : undefined}
          badgeColor="slate"
          footer={`Avg. ${stats.completionRate}% completion rate`}
        />
        <KPICard
          label="Platform Uptime"
          value={`${stats.uptime}%`}
          icon={<CheckCircle className="w-5 h-5 text-emerald-600" />}
          iconBg="bg-emerald-100"
          footer="No incidents reported"
        />
      </div>

      {/* MAIN LAYOUT: Chart + Regional Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-slate-900">Traffic & Load</h3>
              <p className="text-xs text-slate-500">Request volume over the last 6 months.</p>
            </div>
            <div className="bg-slate-100 p-1 rounded-lg flex text-xs font-medium">
              <button className="px-3 py-1 bg-white shadow-sm rounded-md text-slate-900">Requests</button>
              <button className="px-3 py-1 text-slate-500 hover:text-slate-900">Errors</button>
            </div>
          </div>
          <div className="h-80 w-full relative bg-gradient-to-b from-violet-50/50 to-transparent rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-violet-600" />
              </div>
              <p className="text-sm text-slate-500">Analytics chart will be displayed here</p>
              <p className="text-xs text-slate-400 mt-1">Showing API requests over time</p>
            </div>
          </div>
        </div>

        {/* Regional Status */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <h3 className="font-bold text-slate-900 mb-4">Regional Status</h3>
          <div className="space-y-4">
            {regions.map((region, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${region.status === "operational" ? "bg-emerald-500" :
                    region.status === "degraded" ? "bg-amber-500" :
                      "bg-red-500"
                    }`}></div>
                  <div className="text-sm font-medium text-slate-700">{region.name}</div>
                </div>
                <span className={`text-xs font-mono ${region.status === "operational" ? "text-slate-500" :
                  region.status === "degraded" ? "text-amber-600" :
                    "text-red-600"
                  }`}>
                  {region.latency}
                </span>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-2 text-xs font-medium text-slate-500 border border-dashed border-slate-300 rounded-lg hover:border-slate-400 hover:text-slate-700 transition-colors">
            View Full Status Page
          </button>
        </div>
      </div>

      {/* ENTERPRISE DATA TABLE */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-slate-900">Recent Exam Sessions</h3>
            <p className="text-xs text-slate-500">Monitor active and completed assessments.</p>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Filter className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Filter status..."
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                <th className="px-6 py-4">Exam Name</th>
                <th className="px-6 py-4">Created By</th>
                <th className="px-6 py-4">Candidates</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-700">
              {recentExams.length > 0 ? (
                recentExams.map((exam, idx) => (
                  <ExamTableRow key={exam.id || idx} exam={exam} />
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    {loading ? "Loading exams..." : "No exams found. Create your first exam to get started."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500">Showing 1-{Math.min(recentExams.length, 5)} of {stats.exams} exams</span>
          <div className="flex gap-2">
            <button className="px-3 py-1 text-xs border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 flex items-center gap-1">
              <ChevronLeft className="w-3 h-3" /> Previous
            </button>
            <button className="px-3 py-1 text-xs border border-slate-200 rounded hover:bg-slate-50 flex items-center gap-1">
              Next <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// KPI Card Component
function KPICard({
  label,
  value,
  badge,
  badgeColor = "emerald",
  badgeIcon,
  icon,
  iconBg,
  footer,
  footerDot,
}: {
  label: string;
  value: string;
  badge?: string;
  badgeColor?: "emerald" | "slate" | "amber";
  badgeIcon?: React.ReactNode;
  icon?: React.ReactNode;
  iconBg?: string;
  footer?: string;
  footerDot?: string;
}) {
  const badgeColors = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    slate: "bg-slate-100 text-slate-600 border-slate-200",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start z-10 relative">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
          <h3 className="text-3xl font-bold text-slate-900 mt-2">{value}</h3>
        </div>
        {badge && (
          <span className={`${badgeColors[badgeColor]} text-xs font-bold px-2 py-1 rounded-full border flex items-center gap-1`}>
            {badgeIcon}
            {badge}
          </span>
        )}
        {icon && (
          <div className={`w-10 h-10 rounded-full ${iconBg} flex items-center justify-center`}>
            {icon}
          </div>
        )}
      </div>
      {footer && (
        <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
          {footerDot && <span className={`w-2 h-2 rounded-full bg-${footerDot}-500`}></span>}
          {footer}
        </div>
      )}
    </div>
  );
}

// Exam Table Row Component
function ExamTableRow({ exam }: { exam: any }) {
  const icons = [
    { icon: Atom, bg: "bg-blue-50", color: "text-blue-600" },
    { icon: Calculator, bg: "bg-amber-50", color: "text-amber-600" },
    { icon: FlaskConical, bg: "bg-purple-50", color: "text-purple-600" },
    { icon: GraduationCap, bg: "bg-emerald-50", color: "text-emerald-600" },
  ];
  const randomIcon = icons[Math.floor(Math.random() * icons.length)];
  const Icon = randomIcon.icon;

  const statusColors: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-700 border-emerald-100",
    scheduled: "bg-slate-100 text-slate-600 border-slate-200",
    grading: "bg-blue-50 text-blue-700 border-blue-100",
    completed: "bg-violet-50 text-violet-700 border-violet-100",
    draft: "bg-amber-50 text-amber-700 border-amber-100",
  };

  const status = exam.status?.toLowerCase() || "scheduled";
  const statusClass = statusColors[status] || statusColors.scheduled;

  return (
    <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
      <td className="px-6 py-4 font-medium text-slate-900">
        <div className="flex items-center gap-3">
          <div className={`p-1.5 ${randomIcon.bg} ${randomIcon.color} rounded-md`}>
            <Icon className="w-4 h-4" />
          </div>
          {exam.title || "Untitled Exam"}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold">
            {exam.created_by_name?.[0] || "A"}
          </div>
          <span>{exam.created_by_name || "Admin"}</span>
        </div>
      </td>
      <td className="px-6 py-4">{exam.total_questions || 0} Questions</td>
      <td className="px-6 py-4">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusClass}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${status === "active" ? "bg-emerald-500" : status === "grading" ? "bg-blue-500" : "bg-slate-400"}`}></span>
          {exam.status || "Scheduled"}
        </span>
      </td>
      <td className="px-6 py-4 text-slate-500">
        {exam.created_at ? new Date(exam.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A"}
      </td>
      <td className="px-6 py-4 text-right">
        <button className="text-slate-400 hover:text-violet-600 transition-colors">
          <MoreVertical className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
}
