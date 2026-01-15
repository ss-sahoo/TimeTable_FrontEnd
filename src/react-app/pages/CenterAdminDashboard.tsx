import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Home,
  FileText,
  GraduationCap,
  X,
  Users,
  Menu,
  ChevronLeft,
  Zap,
  CalendarDays,
  LogOut,
} from "lucide-react";
import { useAuthContext } from "../contexts/AuthContext";

// Import existing page components
import ExamHub from "./ExamHub";
import Batches from "./Batches";
import Timetable from "./Timetable";
import Dashboard from "./Dashboard";

type SidebarTab = "home" | "exams" | "batches" | "timetable";

export default function CenterAdminDashboard() {
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("home");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-gray-950 dark:via-gray-900 dark:to-slate-900">
      {/* Ambient background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/10 dark:bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-violet-400/10 dark:bg-violet-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-cyan-400/10 dark:bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`hidden lg:flex flex-col bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-r border-slate-200/50 dark:border-gray-800/50 shadow-xl shadow-slate-200/20 dark:shadow-black/20 transition-all duration-300 ${
            sidebarCollapsed ? "w-20" : "w-64"
          }`}
        >
          {/* Logo */}
          <div className="flex items-center justify-between h-[72px] px-5 border-b border-slate-200/50 dark:border-gray-800/50">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/30 flex-shrink-0">
                <Zap className="w-6 h-6 text-white" />
              </div>
              {!sidebarCollapsed && (
                <div className="overflow-hidden">
                  <span className="font-bold text-slate-900 dark:text-white text-lg whitespace-nowrap tracking-tight">DashoExams</span>
                  <p className="text-xs text-slate-500 dark:text-gray-400 whitespace-nowrap">Center Admin</p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
            {!sidebarCollapsed && (
              <p className="px-3 py-2 text-xs font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wider">Menu</p>
            )}
            <SidebarNavItem
              icon={Home}
              label="Home"
              active={sidebarTab === "home"}
              onClick={() => setSidebarTab("home")}
              collapsed={sidebarCollapsed}
            />
            <SidebarNavItem
              icon={FileText}
              label="Exams"
              active={sidebarTab === "exams"}
              onClick={() => setSidebarTab("exams")}
              collapsed={sidebarCollapsed}
            />
            <SidebarNavItem
              icon={GraduationCap}
              label="Batches"
              active={sidebarTab === "batches"}
              onClick={() => setSidebarTab("batches")}
              collapsed={sidebarCollapsed}
            />
            <SidebarNavItem
              icon={CalendarDays}
              label="Timetable"
              active={sidebarTab === "timetable"}
              onClick={() => setSidebarTab("timetable")}
              collapsed={sidebarCollapsed}
            />
          </nav>

          {/* Collapse Toggle */}
          <div className="p-4 border-t border-slate-200/50 dark:border-gray-800/50">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 dark:text-gray-400 hover:bg-slate-100/80 dark:hover:bg-gray-800/80 transition-all"
            >
              {sidebarCollapsed ? (
                <ChevronLeft className="w-5 h-5 rotate-180" />
              ) : (
                <>
                  <ChevronLeft className="w-5 h-5" />
                  <span>Collapse</span>
                </>
              )}
            </button>
          </div>

          {/* Logout Button */}
          <div className="p-4 border-t border-slate-200/50 dark:border-gray-800/50">
            <button
              onClick={handleLogout}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all ${sidebarCollapsed ? 'justify-center' : ''}`}
            >
              <LogOut className="w-5 h-5" />
              {!sidebarCollapsed && <span>Logout</span>}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Header */}
          <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-gray-800/50 h-[72px] flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800"
              >
                <Menu className="w-5 h-5 text-slate-600 dark:text-gray-400" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
                  {sidebarTab === "home" && "Home"}
                  {sidebarTab === "exams" && "Exams"}
                  {sidebarTab === "batches" && "Batches"}
                  {sidebarTab === "timetable" && "Timetable"}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-900 dark:text-white">{user?.full_name || user?.get_full_name || user?.email}</p>
                <p className="text-xs text-slate-500 dark:text-gray-400">Center Admin</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-blue-600 to-violet-600 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
            </div>
          </header>

          {/* Content Area */}
          <main className="flex-1 overflow-y-auto">
            {sidebarTab === "home" && <Dashboard />}
            {sidebarTab === "exams" && <ExamHub />}
            {sidebarTab === "batches" && <Batches />}
            {sidebarTab === "timetable" && <Timetable />}
          </main>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/60" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-900 shadow-xl">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-gray-800">
                <span className="font-bold text-slate-900 dark:text-white text-lg">DashoExams</span>
                <button onClick={() => setMobileMenuOpen(false)}>
                  <X className="w-5 h-5 text-slate-600 dark:text-gray-400" />
                </button>
              </div>
              <nav className="flex-1 p-4 space-y-1">
                <SidebarNavItem
                  icon={Home}
                  label="Home"
                  active={sidebarTab === "home"}
                  onClick={() => {
                    setSidebarTab("home");
                    setMobileMenuOpen(false);
                  }}
                  collapsed={false}
                />
                <SidebarNavItem
                  icon={FileText}
                  label="Exams"
                  active={sidebarTab === "exams"}
                  onClick={() => {
                    setSidebarTab("exams");
                    setMobileMenuOpen(false);
                  }}
                  collapsed={false}
                />
                <SidebarNavItem
                  icon={GraduationCap}
                  label="Batches"
                  active={sidebarTab === "batches"}
                  onClick={() => {
                    setSidebarTab("batches");
                    setMobileMenuOpen(false);
                  }}
                  collapsed={false}
                />
                <SidebarNavItem
                  icon={CalendarDays}
                  label="Timetable"
                  active={sidebarTab === "timetable"}
                  onClick={() => {
                    setSidebarTab("timetable");
                    setMobileMenuOpen(false);
                  }}
                  collapsed={false}
                />
              </nav>
              {/* Mobile Logout Button */}
              <div className="p-4 border-t border-slate-200 dark:border-gray-800">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Sidebar Nav Item Component
function SidebarNavItem({
  icon: Icon,
  label,
  active,
  onClick,
  collapsed,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  onClick: () => void;
  collapsed: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`group flex items-center gap-3 px-3 py-3 rounded-2xl text-sm font-medium transition-all relative overflow-hidden w-full ${
        collapsed ? "justify-center" : ""
      } ${
        active
          ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25"
          : "text-slate-600 dark:text-gray-400 hover:bg-slate-100/80 dark:hover:bg-gray-800/80 hover:text-slate-900 dark:hover:text-white"
      }`}
      title={collapsed ? label : undefined}
    >
      {active && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
      )}
      <Icon className={`w-5 h-5 flex-shrink-0 relative z-10 ${!active && 'group-hover:scale-110 transition-transform'}`} />
      {!collapsed && (
        <span className="whitespace-nowrap overflow-hidden relative z-10">
          {label}
        </span>
      )}
    </button>
  );
}
