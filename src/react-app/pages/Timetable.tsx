import { useState } from "react";
import {
  Building2,
  Users,
  UserCog,
  UserPlus,
  GraduationCap,
  Layers,
  LayoutGrid,
  CalendarRange,
  LineChart,
  Plus,
  ArrowRight,
  ChevronDown,
  Sparkles,
  Settings,
  FolderTree,
  Home,
  Search,
  Filter,
  Mail,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type TabKey = "centers" | "programs" | "exams" | "management";

const centers = [
  {
    id: 1,
    name: "Delhi Main Center",
    code: "DEL-MAIN",
    city: "New Delhi",
    admins: 2,
    teachers: 18,
    staff: 6,
    students: 320,
    programs: 4,
  },
  {
    id: 2,
    name: "Kota Residential",
    code: "KOT-RES",
    city: "Kota",
    admins: 1,
    teachers: 24,
    staff: 10,
    students: 540,
    programs: 6,
  },
  {
    id: 3,
    name: "Online Only Center",
    code: "ONL-01",
    city: "Virtual",
    admins: 1,
    teachers: 12,
    staff: 3,
    students: 780,
    programs: 3,
  },
];

const programs = [
  {
    id: 1,
    name: "Super 30 – JEE Advanced",
    type: "Flagship",
    centers: ["Delhi Main Center", "Kota Residential"],
    batches: [
      { name: "Super 30 – 2026 Elite", students: 30 },
      { name: "Super 30 – 2027 Foundation", students: 28 },
    ],
  },
  {
    id: 2,
    name: "OnlyBoard – CBSE 12th",
    type: "Board Focused",
    centers: ["Delhi Main Center", "Online Only Center"],
    batches: [
      { name: "OnlyBoard XII – Morning", students: 45 },
      { name: "OnlyBoard XII – Evening", students: 40 },
    ],
  },
];

const upcomingExams = [
  {
    id: 1,
    title: "Super 30 – Monthly Mock (January)",
    scope: "Program",
    target: "Super 30 – JEE Advanced",
    date: "12 Jan 2026",
    totalBatches: 2,
  },
  {
    id: 2,
    title: "Institute Level Diagnostic Test",
    scope: "Institute-wide",
    target: "All Programs & Batches",
    date: "20 Jan 2026",
    totalBatches: 14,
  },
];

export default function Timetable() {
  const [activeTab, setActiveTab] = useState<TabKey>("centers");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Top header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 bg-blue-50 text-xs font-medium text-blue-700 border border-blue-100 mb-2">
              <Sparkles className="w-3 h-3" />
              Super Admin Workspace
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-gray-100">
              Institute Control Center
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-gray-400 max-w-2xl">
              Orchestrate institutes, centers, programs, batches and exams from a single, clean
              workspace.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-sm font-medium text-slate-700 dark:text-gray-100 hover:bg-slate-50 transition">
              <Settings className="w-4 h-4" />
              Global Settings
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium shadow-md hover:bg-blue-700 hover:shadow-lg transition">
              <Plus className="w-4 h-4" />
              New Center / Program
            </button>
          </div>
        </div>

        {/* Quick filters row (kept, stats removed as requested) */}
        <div className="flex flex-col sm:flex-row justify-end gap-4">
          <div className="space-y-3 max-w-md w-full">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-4 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Quick Filters (Static)
              </p>
              <div className="space-y-2 text-xs text-slate-600 dark:text-gray-300">
                <button className="w-full inline-flex items-center justify-between px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50">
                  <span className="flex items-center gap-2">
                    <Filter className="w-3 h-3" />
                    Centers with pending admins
                  </span>
                  <span className="text-[11px] font-medium text-slate-500">2</span>
                </button>
                <button className="w-full inline-flex items-center justify-between px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50">
                  <span className="flex items-center gap-2">
                    <Filter className="w-3 h-3" />
                    Programs without batches
                  </span>
                  <span className="text-[11px] font-medium text-slate-500">1</span>
                </button>
              </div>
            </div>
            <div className="bg-blue-600 text-white rounded-xl p-4 shadow-md">
              <p className="text-xs font-semibold uppercase tracking-wide mb-1">
                Design Note (Static)
              </p>
              <p className="text-[11px] leading-relaxed">
                This layout is intentionally modular so we can later plug in real API data for
                centers, programs, batches and exam analytics without changing the overall design.
              </p>
            </div>
          </div>
        </div>

        {/* Main area: left sidebar + tabbed workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Left navigation / info */}
          <aside className={`space-y-4 transition-all ${sidebarCollapsed ? "lg:w-20" : "lg:w-64"}`}>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                {!sidebarCollapsed && (
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Navigation
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => setSidebarCollapsed((prev) => !prev)}
                  className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-slate-200 dark:border-gray-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-gray-900"
                >
                  {sidebarCollapsed ? (
                    <ChevronRight className="w-4 h-4" />
                  ) : (
                    <ChevronLeft className="w-4 h-4" />
                  )}
                </button>
              </div>
              <nav className="space-y-1 text-sm">
                <SideNavItem
                  icon={Building2}
                  label="Centers"
                  active={activeTab === "centers"}
                  onClick={() => setActiveTab("centers")}
                  collapsed={sidebarCollapsed}
                />
                <SideNavItem
                  icon={Layers}
                  label="Programs & Batches"
                  active={activeTab === "programs"}
                  onClick={() => setActiveTab("programs")}
                  collapsed={sidebarCollapsed}
                />
                <SideNavItem
                  icon={LayoutGrid}
                  label="Exams"
                  active={activeTab === "exams"}
                  onClick={() => setActiveTab("exams")}
                  collapsed={sidebarCollapsed}
                />
                <SideNavItem
                  icon={FolderTree}
                  label="Management"
                  active={activeTab === "management"}
                  onClick={() => setActiveTab("management")}
                  collapsed={sidebarCollapsed}
                />
              </nav>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-4 text-xs space-y-2">
              <p className="font-semibold text-slate-800 dark:text-gray-100 flex items-center gap-2">
                <Home className="w-3 h-3" />
                Home & People (Later)
              </p>
              <p className="text-slate-600 dark:text-gray-400">
                The “Management” tab will later control home layout, people directory and role based
                onboarding flows for each center and program.
              </p>
            </div>
          </aside>

          {/* Right workspace: tabs + content */}
          <div className="lg:col-span-3 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
            <div className="border-b border-slate-200 dark:border-gray-700 bg-slate-50/70 dark:bg-gray-900/40 px-4 sm:px-6">
              <div className="flex flex-wrap gap-2 py-3">
                <TabChip
                  icon={Building2}
                  label="Centers"
                  active={activeTab === "centers"}
                  onClick={() => setActiveTab("centers")}
                />
                <TabChip
                  icon={Layers}
                  label="Programs & Batches"
                  active={activeTab === "programs"}
                  onClick={() => setActiveTab("programs")}
                />
                <TabChip
                  icon={LayoutGrid}
                  label="Exams"
                  active={activeTab === "exams"}
                  onClick={() => setActiveTab("exams")}
                />
                <TabChip
                  icon={FolderTree}
                  label="Management"
                  active={activeTab === "management"}
                  onClick={() => setActiveTab("management")}
                />
              </div>
            </div>
            <div className="p-4 sm:p-6 space-y-6">
              {activeTab === "centers" && <CentersTab />}
              {activeTab === "programs" && <ProgramsTab />}
              {activeTab === "exams" && <ExamsTab />}
              {activeTab === "management" && <ManagementTab />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  pill,
  color,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  value: string;
  pill: string;
  color: "blue" | "purple" | "emerald" | "orange";
}) {
  const colorClasses: Record<typeof color, string> = {
    blue: "bg-blue-50 text-blue-700",
    purple: "bg-purple-50 text-purple-700",
    emerald: "bg-emerald-50 text-emerald-700",
    orange: "bg-orange-50 text-orange-700",
  } as const;

  const iconBg: Record<typeof color, string> = {
    blue: "bg-blue-600",
    purple: "bg-purple-600",
    emerald: "bg-emerald-600",
    orange: "bg-orange-600",
  } as const;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-gray-100">{value}</p>
          <span
            className={`inline-flex items-center mt-2 px-2.5 py-1 rounded-full text-[11px] font-medium ${colorClasses[color]}`}
          >
            {pill}
          </span>
        </div>
        <div className={`w-10 h-10 rounded-xl ${iconBg[color]} flex items-center justify-center shadow-lg`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}

function TabChip({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-full border transition-all ${
        active
          ? "bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500 shadow-sm"
          : "text-slate-600 dark:text-gray-300 border-transparent hover:bg-white/60 dark:hover:bg-gray-800/80"
      }`}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
}

function CentersTab() {
  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-gray-100">Centers</h2>
          <p className="text-sm text-slate-600 dark:text-gray-400">
            Assign admins, teachers, staff and students to individual centers. All static for now.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search centers..."
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white dark:bg-gray-900 dark:border-gray-700 text-slate-700 dark:text-gray-100"
              readOnly
            />
          </div>
          <button className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-dashed border-slate-300 text-xs text-slate-700 hover:bg-slate-50">
            <Plus className="w-3 h-3" />
            Add Center
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {centers.map((center) => (
          <div
            key={center.id}
            className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-gray-700 bg-gradient-to-br from-white to-slate-50 dark:from-gray-900 dark:to-gray-800 p-4 shadow-sm hover:shadow-md transition-all"
          >
            <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute -right-16 -top-16 w-32 h-32 bg-blue-50 dark:bg-blue-900/20 rounded-full blur-3xl" />
            </div>

            <div className="flex items-start justify-between gap-3 relative z-10">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-gray-100">
                    {center.name}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-medium">
                    {center.code}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-gray-400">{center.city}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-md">
                <Building2 className="w-5 h-5 text-white" />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-600 dark:text-gray-300">
              <div className="flex items-center gap-2">
                <UserCog className="w-4 h-4 text-slate-500" />
                <div>
                  <p className="font-medium">{center.admins}</p>
                  <p className="text-[11px] text-slate-500">Admins</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-slate-500" />
                <div>
                  <p className="font-medium">{center.teachers}</p>
                  <p className="text-[11px] text-slate-500">Teachers</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-500" />
                <div>
                  <p className="font-medium">{center.staff}</p>
                  <p className="text-[11px] text-slate-500">Staff</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-500" />
                <div>
                  <p className="font-medium">{center.students}</p>
                  <p className="text-[11px] text-slate-500">Students</p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
              <p>{center.programs} active programs</p>
              <button className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs font-medium">
                Manage Center
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
      {/* Static create center form layout */}
      <div className="mt-2 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 dark:bg-gray-900/60 p-4">
          <p className="text-xs font-semibold text-slate-700 dark:text-gray-200 mb-3">
            Add / Edit Center (Static Form Layout)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-slate-600">Center Name</label>
              <input
                readOnly
                placeholder="e.g. Delhi Main Center"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-slate-600">Center Code</label>
              <input
                readOnly
                placeholder="DEL-MAIN"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-slate-600">City</label>
              <input
                readOnly
                placeholder="New Delhi"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-slate-600">
                Default Programs
              </label>
              <select
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700"
                disabled
              >
                <option>Super 30, OnlyBoard (static)</option>
              </select>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <button className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 text-white">
              <Plus className="w-3 h-3" />
              Save (Mock)
            </button>
            <button className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700">
              Cancel
            </button>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 text-xs space-y-2">
          <p className="font-semibold text-slate-800 dark:text-gray-100">Role Assignment Idea</p>
          <p className="text-slate-600 dark:text-gray-400">
            Each center will later have a “People” sub-page where you can pick users and assign them
            as <strong>admin</strong>, <strong>teacher</strong>, <strong>staff</strong> or{" "}
            <strong>student</strong>. Teacher and staff can be promoted to admin.
          </p>
        </div>
      </div>
    </div>
  );
}

function ProgramsTab() {
  const [expandedProgramId, setExpandedProgramId] = useState<number | null>(1);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-gray-100">
            Programs & Batches
          </h2>
          <p className="text-sm text-slate-600 dark:text-gray-400">
            Each program can host multiple batches, and each batch contains a group of students.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 hover:bg-slate-50">
            <Layers className="w-4 h-4" />
            New Program
          </button>
          <button className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700">
            <Plus className="w-4 h-4" />
            New Batch
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {programs.map((program) => {
          const expanded = expandedProgramId === program.id;
          return (
            <div
              key={program.id}
              className="rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50/60 dark:bg-gray-900/80 overflow-hidden"
            >
              <button
                onClick={() =>
                  setExpandedProgramId(expanded ? null : program.id)
                }
                className="w-full flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow">
                    <GraduationCap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-gray-100">
                      {program.name}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-gray-400">
                      {program.type} • {program.batches.length} batches •{" "}
                      {program.centers.length} centers
                    </p>
                  </div>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-500 transition-transform ${
                    expanded ? "rotate-180" : ""
                  }`}
                />
              </button>

              {expanded && (
                <div className="border-t border-slate-200 dark:border-gray-700 px-4 sm:px-5 py-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="space-y-2">
                    <p className="font-medium text-slate-700 dark:text-gray-200">
                      Centers
                    </p>
                    <ul className="space-y-1 text-slate-600 dark:text-gray-400">
                      {program.centers.map((center) => (
                        <li key={center} className="flex items-center gap-2">
                          <Building2 className="w-3 h-3" />
                          <span>{center}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <p className="font-medium text-slate-700 dark:text-gray-200">
                      Batches in this Program
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {program.batches.map((batch) => (
                        <div
                          key={batch.name}
                          className="rounded-lg border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 flex items-center justify-between"
                        >
                          <div>
                            <p className="text-xs font-semibold text-slate-900 dark:text-gray-100">
                              {batch.name}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {batch.students} students
                            </p>
                          </div>
                          <button className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-[11px] font-medium hover:bg-blue-100">
                            <Users className="w-3 h-3" />
                            Manage
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Static program creation form layout */}
      <div className="mt-2 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 dark:bg-gray-900/60 p-4 space-y-3">
          <p className="text-xs font-semibold text-slate-700 dark:text-gray-200">
            Program Creation (Static Form Layout)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-slate-600">Program Name</label>
              <input
                readOnly
                placeholder="Super 30 – JEE Advanced"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-slate-600">Program Type</label>
              <select
                disabled
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700"
              >
                <option>Flagship (Super 30)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-slate-600">
                Associated Centers
              </label>
              <input
                readOnly
                placeholder="Delhi Main Center, Kota Residential"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-slate-600">
                Academic Session
              </label>
              <input
                readOnly
                placeholder="2025–2026"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700"
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-500">
            Below this we can later add an inline table for configuring default{" "}
            <strong>batches</strong> and mapping to exam patterns.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 text-xs space-y-2">
          <p className="font-semibold text-slate-800 dark:text-gray-100">
            Batch Design Suggestion
          </p>
          <p className="text-slate-600 dark:text-gray-400">
            Each batch will later reference a program, center, academic year and list of students.
            Admins will be able to assign multiple batches to a program and then target exams to
            either entire programs or specific batches.
          </p>
        </div>
      </div>
    </div>
  );
}

function ExamsTab() {
  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-gray-100">
            Exams – Program & General
          </h2>
          <p className="text-sm text-slate-600 dark:text-gray-400">
            Create exams either for specific programs/batches or for the entire institute.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700">
            <Plus className="w-4 h-4" />
            Create Program Exam
          </button>
          <button className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 text-white text-sm hover:bg-black">
            <Plus className="w-4 h-4" />
            Create General Exam
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-3">
          {upcomingExams.map((exam) => (
            <div
              key={exam.id}
              className="rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow">
                  <CalendarRange className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-gray-100">
                    {exam.title}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-gray-400">
                    {exam.scope} • {exam.target}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {exam.totalBatches} batches linked
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-start sm:items-end gap-2 text-xs">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-medium">
                  {exam.date}
                </span>
                <button className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium">
                  View Blueprint
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-900 text-white p-4">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <LineChart className="w-4 h-4" />
              High-level Snapshot
            </h3>
            <ul className="space-y-2 text-xs text-slate-200">
              <li className="flex justify-between">
                <span>Active exams</span>
                <span className="font-semibold">8</span>
              </li>
              <li className="flex justify-between">
                <span>Scheduled this week</span>
                <span className="font-semibold">3</span>
              </li>
              <li className="flex justify-between">
                <span>Programs covered</span>
                <span className="font-semibold">4</span>
              </li>
              <li className="flex justify-between">
                <span>General exams</span>
                <span className="font-semibold">2</span>
              </li>
            </ul>
          </div>

          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-xs text-slate-600">
            <p className="font-semibold mb-1">Design Hint</p>
            <p>
              This panel will later show aggregated analytics across centers, programs and batches -
              keep the layout clean for charts.
            </p>
          </div>
        </div>
      </div>

      {/* Static exam meta section */}
      <div className="rounded-xl border border-dashed border-slate-300 bg-white dark:bg-gray-900 p-4 text-xs space-y-3">
        <p className="font-semibold text-slate-800 dark:text-gray-100">
          Exam Blueprint (Static Form Sketch)
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-slate-600">Exam Title</label>
            <input
              readOnly
              placeholder="Super 30 – Monthly Mock (January)"
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-700"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-slate-600">Scope</label>
            <select
              disabled
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-700"
            >
              <option>Program (Super 30)</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-slate-600">Target Batches</label>
            <input
              readOnly
              placeholder="Super 30 – 2026 Elite, 2027 Foundation"
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-700"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-slate-600">Schedule</label>
            <input
              readOnly
              placeholder="12 Jan 2026 • 10:00 AM"
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-700"
            />
          </div>
        </div>
        <p className="text-[11px] text-slate-500">
          In the real implementation, this area can expand into the full exam creation wizard,
          connecting to existing exam setup screens you already have in the product.
        </p>
      </div>
    </div>
  );
}

function SideNavItem({
  icon: Icon,
  label,
  active,
  collapsed,
  onClick,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full inline-flex items-center justify-between px-3 py-2 rounded-lg transition ${
        active
          ? "bg-slate-900 text-white"
          : "text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-800"
      }`}
    >
      <span className="inline-flex items-center gap-2 text-xs font-medium">
        <Icon className="w-4 h-4" />
        {!collapsed && <span>{label}</span>}
      </span>
      {!collapsed && active && (
        <span className="text-[10px] uppercase tracking-wide text-blue-200">Active</span>
      )}
    </button>
  );
}

function ManagementTab() {
  const items = [
    {
      title: "Home Layout",
      description: "Configure what each role sees on their first landing screen.",
      icon: Home,
    },
    {
      title: "People & Roles",
      description: "Manage admins, teachers, staff and students per center.",
      icon: Users,
    },
    {
      title: "Admin Profiles",
      description: "Control profile details, permissions and access levels for admins.",
      icon: UserPlus,
    },
    {
      title: "Batches",
      description: "Create and organize batches under programs and centers.",
      icon: GraduationCap,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-gray-100">
            Management Console
          </h2>
          <p className="text-sm text-slate-600 dark:text-gray-400">
            Central place to manage home layouts, people, admin profiles and batches.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 hover:bg-slate-50">
          <Settings className="w-4 h-4" />
          Open Global Config
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 flex items-start gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-gray-100">
                  {item.title}
                </h3>
                <p className="mt-1 text-xs text-slate-600 dark:text-gray-400">
                  {item.description}
                </p>
                <button className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700">
                  Configure
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 dark:bg-gray-900/60 p-4 text-xs space-y-2">
        <p className="font-semibold text-slate-800 dark:text-gray-100 flex items-center gap-2">
          <Users className="w-3 h-3" />
          Future People Management Flow
        </p>
        <p className="text-slate-600 dark:text-gray-400">
          Here we will later add dedicated tables and forms for:
        </p>
        <ul className="list-disc list-inside text-slate-600 dark:text-gray-400 space-y-1">
          <li>Global people directory (all users across centers).</li>
          <li>Role assignment editor (superadmin, admin, teacher, staff, student).</li>
          <li>Batch mapping screens to quickly place students into multiple batches.</li>
        </ul>
        <p className="text-[11px] text-slate-500 mt-1">
          The current design is intentionally generic and static so we can extend it safely with
          backend APIs later.
        </p>
      </div>
    </div>
  );
}


