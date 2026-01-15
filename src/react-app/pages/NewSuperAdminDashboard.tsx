import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  LayoutGrid,
  Building2,
  MapPin,
  Users,
  FileText,
  Layers,
  Calendar,
  Bell,
  HelpCircle,
  Search,
  ChevronDown,
  Zap,
  TrendingUp,
  ArrowUpRight,
  CheckCircle,
  MoreVertical,
  Download,
  LogOut,
  Settings,
  ChartPie,
  Receipt,
  Filter,
  ChevronLeft,
  ChevronRight,
  Atom,
  Calculator,
  FlaskConical,
  GraduationCap,
} from "lucide-react";
import { useAuthContext } from "../contexts/AuthContext";
import { api } from "../hooks/useApi";

// Import content components
import InstituteContent from "../components/superadmin/InstituteContent";
import CentersContent from "../components/superadmin/CentersContent";
import UsersContent from "../components/superadmin/UsersContent";
import ExamsContent from "../components/superadmin/ExamsContent";
import BatchesContent from "../components/superadmin/BatchesContent";
import TimetableContent from "../components/superadmin/TimetableContent";
import SettingsContent from "../components/superadmin/SettingsContent";
import ProfileContent from "../components/superadmin/ProfileContent";

type TabType = "overview" | "analytics" | "users" | "institutes" | "exams" | "batches" | "timetable" | "billing" | "settings" | "profile";

const platformNavItems = [
  { id: "overview" as const, label: "Overview", icon: LayoutGrid },
  { id: "analytics" as const, label: "Analytics", icon: ChartPie },
  { id: "users" as const, label: "User Management", icon: Users },
];

const operationsNavItems = [
  { id: "institutes" as const, label: "Institutes & Centers", icon: Building2, badge: true },
  { id: "exams" as const, label: "Exam Controller", icon: FileText },
  { id: "batches" as const, label: "Batches", icon: Layers },
  { id: "timetable" as const, label: "Timetable", icon: Calendar },
  { id: "billing" as const, label: "Billing & Logs", icon: Receipt },
];

export default function NewSuperAdminDashboard() {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuthContext();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>((searchParams.get("tab") as TabType) || "overview");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const tab = searchParams.get("tab") as TabType;
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login", { replace: true });
    }
    if (!authLoading && user?.role !== "super_admin" && user?.role !== "SUPER_ADMIN") {
      navigate("/dashboard", { replace: true });
    }
  }, [user, isAuthenticated, authLoading, navigate]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 text-slate-600 font-sans antialiased h-screen flex overflow-hidden">
      {/* SIDEBAR */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col z-30">
        {/* Context Switcher (Organization Selector) */}
        <div className="h-16 flex items-center px-4 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
          <div className="flex items-center gap-3 w-full">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-violet-700 rounded-lg flex items-center justify-center text-white shadow-sm">
              <Zap className="w-4 h-4" />
            </div>
            <div className="flex-1 overflow-hidden">
              <h1 className="font-bold text-sm text-slate-900 leading-tight">
                {user?.institute?.name || user?.institute_name || "DashoExams"}
              </h1>
              <p className="text-[10px] text-slate-500 font-medium tracking-wide">ENTERPRISE PLAN</p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="flex items-center gap-2 px-3 mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Platform</span>
          </div>
          {platformNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`nav-item w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all group relative ${
                  isActive
                    ? "bg-violet-50 text-violet-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[70%] bg-violet-600 rounded-r" />
                )}
                <Icon className={`w-[18px] h-[18px] ${isActive ? "text-violet-600" : "text-slate-400 group-hover:text-slate-600"}`} />
                {item.label}
              </button>
            );
          })}

          <div className="flex items-center gap-2 px-3 mb-2 mt-6">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Operations</span>
          </div>
          {operationsNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`nav-item w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all group relative ${
                  isActive
                    ? "bg-violet-50 text-violet-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[70%] bg-violet-600 rounded-r" />
                )}
                <Icon className={`w-[18px] h-[18px] ${isActive ? "text-violet-600" : "text-slate-400 group-hover:text-slate-600"}`} />
                {item.label}
                {item.badge && (
                  <span className="ml-auto bg-slate-100 text-slate-500 py-0.5 px-2 rounded-full text-[10px] font-bold border border-slate-200">
                    14
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white shadow-sm">
              {user?.first_name?.[0] || "S"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">
                {user?.first_name || "Super"} {user?.last_name || "Admin"}
              </p>
              <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
            </div>
            <button onClick={() => handleTabChange("settings")} className="text-slate-400 hover:text-slate-600">
              <Settings className="w-[18px] h-[18px]" />
            </button>
          </div>
          <button
            onClick={handleLogout}
            className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* HEADER (Global Command Center) */}
        <header className="bg-white/95 backdrop-blur-sm border-b border-slate-200 h-16 sticky top-0 z-20 flex justify-between items-center px-6">
          {/* Center: Command Palette */}
          <div className="flex-1 max-w-xl mx-auto">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-12 py-2 bg-slate-100 border-none rounded-lg text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:shadow-sm transition-all"
                placeholder="Search students, exams, or settings..."
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <kbd className="inline-flex items-center border border-slate-200 rounded px-2 text-[10px] font-sans font-medium text-slate-400 bg-white">
                  ⌘K
                </kbd>
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3 pl-4">
            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              <HelpCircle className="w-5 h-5" />
            </button>
            <div className="h-6 w-px bg-slate-200 mx-1"></div>
            {/* Organization Status */}
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-xs font-medium text-slate-600">System Operational</span>
            </div>
          </div>
        </header>

        {/* SCROLLABLE CANVAS */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-6 lg:p-8">
          <div className="max-w-[1600px] mx-auto">
            {activeTab === "overview" && <DashboardContent user={user} />}
            {activeTab === "analytics" && <DashboardContent user={user} />}
            {activeTab === "institutes" && <CentersContent />}
            {activeTab === "users" && <UsersContent />}
            {activeTab === "exams" && <ExamsContent />}
            {activeTab === "batches" && <BatchesContent />}
            {activeTab === "timetable" && <TimetableContent />}
            {activeTab === "billing" && <DashboardContent user={user} />}
            {activeTab === "settings" && <SettingsContent />}
            {activeTab === "profile" && <ProfileContent />}
          </div>
        </div>
      </main>
    </div>
  );
}

// Dashboard Content Component
function DashboardContent({ user }: { user: any }) {
  const [stats, setStats] = useState({
    centers: 0,
    students: 0,
    exams: 0,
    teachers: 0,
  });
  const [recentExams, setRecentExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const instituteId = user?.institute_id || user?.institute?.id;
      if (!instituteId) {
        setLoading(false);
        return;
      }

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
          students: studentCount,
          exams: Array.isArray(exams) ? exams.length : 0,
          teachers: teacherCount,
        });

        // Set recent exams
        if (Array.isArray(exams)) {
          setRecentExams(exams.slice(0, 5));
        }
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user?.institute_id, user?.institute?.id]);

  const regions = [
    { name: "Asia Pacific (Mumbai)", latency: "42ms", status: "emerald" },
    { name: "Asia Pacific (Singapore)", latency: "86ms", status: "emerald" },
    { name: "US East (N. Virginia)", latency: "140ms", status: "amber" },
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
          badge="+2 new"
          badgeColor="emerald"
          footer="100% Operational"
          footerDot="emerald"
        />
        <KPICard
          label="Active Students"
          value={loading ? "..." : stats.students.toLocaleString()}
          badge="+12.5%"
          badgeColor="emerald"
          badgeIcon={<TrendingUp className="w-3 h-3" />}
          footer={`${stats.teachers} teachers enrolled`}
        />
        <KPICard
          label="Exams Conducted"
          value={loading ? "..." : stats.exams.toString()}
          badge="This Year"
          badgeColor="slate"
          footer="Avg. 85% completion rate"
        />
        <KPICard
          label="Platform Uptime"
          value="99.99%"
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
                  <div className={`w-2 h-2 rounded-full bg-${region.status}-500`}></div>
                  <div className="text-sm font-medium text-slate-700">{region.name}</div>
                </div>
                <span className={`text-xs font-mono ${region.status === "amber" ? "text-amber-600" : "text-slate-500"}`}>
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
