import { useState, useEffect, useRef } from "react";
import {
  Home,
  FileText,
  GraduationCap,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  X,
  MoreVertical,
  Users,
  Calendar,
  Clock,
  Building2,
  Menu,
  ChevronLeft,
  Zap,
  UserCheck,
  Activity,
  TrendingUp,
} from "lucide-react";
import { useAuthContext } from "../contexts/AuthContext";

type SidebarTab = "home" | "exams" | "batches";

interface Batch {
  id: number;
  name: string;
  program: string;
  students: number;
  startDate: string;
  endDate: string;
  status: "active" | "inactive";
}

interface Exam {
  id: number;
  title: string;
  program: string;
  date: string;
  time: string;
  duration: number;
  participants: number;
  status: "scheduled" | "ongoing" | "completed";
}

interface Program {
  id: number;
  name: string;
  type: string;
  batches: number;
  students: number;
}

const mockPrograms: Program[] = [
  {
    id: 1,
    name: "Super 30 – JEE Advanced",
    type: "Flagship",
    batches: 2,
    students: 58,
  },
  {
    id: 2,
    name: "OnlyBoard – CBSE 12th",
    type: "Board Focused",
    batches: 2,
    students: 85,
  },
];

const mockExams: Exam[] = [
  {
    id: 1,
    title: "Super 30 – Monthly Mock (January)",
    program: "Super 30 – JEE Advanced",
    date: "2025-01-12",
    time: "10:00 AM",
    duration: 180,
    participants: 58,
    status: "scheduled",
  },
  {
    id: 2,
    title: "OnlyBoard – Mid Term Exam",
    program: "OnlyBoard – CBSE 12th",
    date: "2025-01-15",
    time: "02:00 PM",
    duration: 180,
    participants: 85,
    status: "scheduled",
  },
];

const mockBatches: Batch[] = [
  {
    id: 1,
    name: "Super 30 – 2026 Elite",
    program: "Super 30 – JEE Advanced",
    students: 30,
    startDate: "2024-01-01",
    endDate: "2025-12-31",
    status: "active",
  },
  {
    id: 2,
    name: "Super 30 – 2027 Foundation",
    program: "Super 30 – JEE Advanced",
    students: 28,
    startDate: "2024-01-01",
    endDate: "2026-12-31",
    status: "active",
  },
  {
    id: 3,
    name: "OnlyBoard XII – Morning",
    program: "OnlyBoard – CBSE 12th",
    students: 45,
    startDate: "2024-01-01",
    endDate: "2025-03-31",
    status: "active",
  },
];

export default function CenterAdminDashboard() {
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("home");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuthContext();

  // Modal states
  const [showCreateExamModal, setShowCreateExamModal] = useState(false);
  const [showCreateBatchModal, setShowCreateBatchModal] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      {/* Ambient background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-violet-400/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-cyan-400/10 rounded-full blur-3xl" />
      </div>

      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`hidden lg:flex flex-col bg-white/80 backdrop-blur-xl border-r border-slate-200/50 shadow-xl shadow-slate-200/20 transition-all duration-300 ${
            sidebarCollapsed ? "w-20" : "w-64"
          }`}
        >
          {/* Logo */}
          <div className="flex items-center justify-between h-[72px] px-5 border-b border-slate-200/50">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/30 flex-shrink-0">
                <Zap className="w-6 h-6 text-white" />
              </div>
              {!sidebarCollapsed && (
                <div className="overflow-hidden">
                  <span className="font-bold text-slate-900 text-lg whitespace-nowrap tracking-tight">DashoExams</span>
                  <p className="text-xs text-slate-500 whitespace-nowrap">Center Admin</p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
            {!sidebarCollapsed && (
              <p className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Menu</p>
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
          </nav>

          {/* Collapse Toggle */}
          <div className="p-4 border-t border-slate-200/50">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-100/80 transition-all"
            >
              {sidebarCollapsed ? (
                <ChevronLeft className="w-5 h-5" />
              ) : (
                <>
                  <ChevronLeft className="w-5 h-5" />
                  <span>Collapse</span>
                </>
              )}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Header */}
          <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 h-[72px] flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-slate-100"
              >
                <Menu className="w-5 h-5 text-slate-600" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-slate-900">
                  {sidebarTab === "home" && "Home"}
                  {sidebarTab === "exams" && "Exams"}
                  {sidebarTab === "batches" && "Batches"}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-900">{user?.get_full_name || user?.email}</p>
                <p className="text-xs text-slate-500">Center Admin</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-blue-600 to-violet-600 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
            </div>
          </header>

          {/* Content Area */}
          <main className="flex-1 overflow-y-auto p-6">
            {sidebarTab === "home" && <HomeTab />}
            {sidebarTab === "exams" && (
              <ExamsTab
                onCreateExam={() => setShowCreateExamModal(true)}
                onProgramSelect={setSelectedProgram}
              />
            )}
            {sidebarTab === "batches" && (
              <BatchesTab onCreateBatch={() => setShowCreateBatchModal(true)} />
            )}
          </main>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/60" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-5 border-b">
                <span className="font-bold text-slate-900 text-lg">DashoExams</span>
                <button onClick={() => setMobileMenuOpen(false)}>
                  <X className="w-5 h-5" />
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
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showCreateExamModal && (
        <CreateExamModal
          programs={mockPrograms}
          selectedProgram={selectedProgram}
          onClose={() => {
            setShowCreateExamModal(false);
            setSelectedProgram(null);
          }}
        />
      )}
      {showCreateBatchModal && (
        <CreateBatchModal programs={mockPrograms} onClose={() => setShowCreateBatchModal(false)} />
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
          : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
      }`}
      title={collapsed ? label : undefined}
    >
      {active && (
        <>
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-violet-400/10" />
        </>
      )}
      <Icon className="w-5 h-5 flex-shrink-0 relative z-10" />
      {!collapsed && <span className="relative z-10">{label}</span>}
    </button>
  );
}

// Home Tab Component
function HomeTab() {
  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome to Your Center</h2>
            <p className="text-slate-600">Manage your center's programs, exams, and batches from here</p>
          </div>
          <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center">
            <Building2 className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          icon={FileText}
          label="Total Exams"
          value="12"
          color="blue"
        />
        <StatCard
          icon={GraduationCap}
          label="Active Batches"
          value="3"
          color="purple"
        />
        <StatCard
          icon={Users}
          label="Total Students"
          value="143"
          color="green"
        />
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900">New exam created</p>
              <p className="text-xs text-slate-500">Super 30 – Monthly Mock</p>
            </div>
            <span className="text-xs text-slate-500">2 hours ago</span>
          </div>
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900">New batch created</p>
              <p className="text-xs text-slate-500">Super 30 – 2027 Foundation</p>
            </div>
            <span className="text-xs text-slate-500">1 day ago</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color: "blue" | "purple" | "green";
}) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    purple: "bg-purple-100 text-purple-600",
    green: "bg-green-100 text-green-600",
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500 mb-1">{label}</p>
          <p className="text-3xl font-bold text-slate-900">{value}</p>
        </div>
        <div className={`w-12 h-12 ${colorClasses[color]} rounded-xl flex items-center justify-center`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

// Exams Tab Component
function ExamsTab({
  onCreateExam,
  onProgramSelect,
}: {
  onCreateExam: () => void;
  onProgramSelect: (program: Program) => void;
}) {
  const [exams] = useState<Exam[]>(mockExams);
  const [programs] = useState<Program[]>(mockPrograms);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredExams = exams.filter(
    (exam) =>
      exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.program.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleProgramClick = (program: Program) => {
    onProgramSelect(program);
    onCreateExam();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search exams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={onCreateExam}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-500/25"
        >
          <Plus className="w-4 h-4" />
          Create Exam
        </button>
      </div>

      {/* Program Selection */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Select Program to Create Exam</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {programs.map((program) => (
            <button
              key={program.id}
              onClick={() => handleProgramClick(program)}
              className="p-4 border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-slate-900">{program.name}</h4>
                <GraduationCap className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-sm text-slate-500 mb-2">{program.type}</p>
              <div className="flex gap-4 text-sm">
                <span className="text-slate-600">
                  <strong>{program.batches}</strong> batches
                </span>
                <span className="text-slate-600">
                  <strong>{program.students}</strong> students
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Exams List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">All Exams</h3>
        </div>
        <div className="divide-y divide-slate-200">
          {filteredExams.map((exam) => (
            <ExamRow key={exam.id} exam={exam} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Exam Row Component
function ExamRow({ exam }: { exam: Exam }) {
  const statusColors = {
    scheduled: "bg-blue-100 text-blue-800",
    ongoing: "bg-green-100 text-green-800",
    completed: "bg-slate-100 text-slate-800",
  };

  return (
    <div className="p-6 hover:bg-slate-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h4 className="text-base font-semibold text-slate-900 mb-1">{exam.title}</h4>
          <p className="text-sm text-slate-600 mb-2">{exam.program}</p>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {exam.date}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {exam.time}
            </span>
            <span>{exam.duration} minutes</span>
            <span>{exam.participants} participants</span>
          </div>
        </div>
        <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusColors[exam.status]}`}>
          {exam.status}
        </span>
      </div>
    </div>
  );
}

// Batches Tab Component
function BatchesTab({ onCreateBatch }: { onCreateBatch: () => void }) {
  const [batches] = useState<Batch[]>(mockBatches);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBatches = batches.filter(
    (batch) =>
      batch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      batch.program.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search batches..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={onCreateBatch}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-500/25"
        >
          <Plus className="w-4 h-4" />
          Create Batch
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBatches.map((batch) => (
          <BatchCard key={batch.id} batch={batch} />
        ))}
      </div>
    </div>
  );
}

// Batch Card Component
function BatchCard({ batch }: { batch: Batch }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{batch.name}</h3>
            <p className="text-sm text-slate-500">{batch.program}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Students</span>
          <span className="font-medium text-slate-900">{batch.students}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Start Date</span>
          <span className="font-medium text-slate-900">{batch.startDate}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">End Date</span>
          <span className="font-medium text-slate-900">{batch.endDate}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <span
          className={`px-2 py-1 text-xs font-medium rounded ${
            batch.status === "active"
              ? "bg-green-100 text-green-700"
              : "bg-slate-100 text-slate-700"
          }`}
        >
          {batch.status}
        </span>
        <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
          Manage →
        </button>
      </div>
    </div>
  );
}

// Modal Components
function Modal({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />
        <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-500">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="bg-white px-6 py-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

function CreateExamModal({
  programs,
  selectedProgram,
  onClose,
}: {
  programs: Program[];
  selectedProgram: Program | null;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    title: "",
    programId: selectedProgram?.id.toString() || "",
    date: "",
    time: "",
    duration: "",
  });

  return (
    <Modal isOpen={true} onClose={onClose} title="Create Exam">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Program</label>
          <select
            value={formData.programId}
            onChange={(e) => setFormData({ ...formData, programId: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select Program</option>
            {programs.map((program) => (
              <option key={program.id} value={program.id}>
                {program.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Exam Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter exam title"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Time</label>
            <input
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Duration (minutes)</label>
          <input
            type="number"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="180"
          />
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          Create Exam
        </button>
      </div>
    </Modal>
  );
}

function CreateBatchModal({
  programs,
  onClose,
}: {
  programs: Program[];
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    name: "",
    programId: "",
    startDate: "",
    endDate: "",
  });

  return (
    <Modal isOpen={true} onClose={onClose} title="Create Batch">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Program</label>
          <select
            value={formData.programId}
            onChange={(e) => setFormData({ ...formData, programId: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select Program</option>
            {programs.map((program) => (
              <option key={program.id} value={program.id}>
                {program.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Batch Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Super 30 – 2027 Foundation"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          Create Batch
        </button>
      </div>
    </Modal>
  );
}

