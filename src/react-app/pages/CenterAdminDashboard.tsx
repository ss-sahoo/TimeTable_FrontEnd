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
  CalendarDays,
  User,
  Shield,
} from "lucide-react";
import { useAuthContext } from "../contexts/AuthContext";
import { useApi, api } from "../hooks/useApi";
import Timetable from "./Timetable";

type SidebarTab = "home" | "exams" | "batches" | "timetable";

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
            <SidebarNavItem
              icon={CalendarDays}
              label="Timetable"
              active={sidebarTab === "timetable"}
              onClick={() => setSidebarTab("timetable")}
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
                  {sidebarTab === "timetable" && "Timetable"}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-900">{user?.full_name || user?.get_full_name || user?.email}</p>
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
            {sidebarTab === "timetable" && <Timetable />}
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

// Interfaces for API responses
interface Center {
  id: string;
  name: string;
  city?: string;
  address?: string;
  institute?: {
    id: string;
    name: string;
  };
  created_at?: string;
  updated_at?: string;
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

// Home Tab Component with Tabs
function HomeTab() {
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState<"profile" | "peoples">("profile");
  const [centerId, setCenterId] = useState<string | null>(null);

  // Get center_id from user or fetch from profile
  useEffect(() => {
    const getCenterId = async () => {
      if (user?.center_id) {
        setCenterId(user.center_id);
      } else {
        // Try to fetch user profile to get center_id
        try {
          const response = await api.get('/auth/profile/');
          if (response.data?.center_id) {
            setCenterId(response.data.center_id);
          }
        } catch (error) {
          console.error("Failed to fetch center_id:", error);
        }
      }
    };
    getCenterId();
  }, [user]);

  return (
    <div className="space-y-6">
      {/* Tabs Navigation */}
      <div className="bg-white rounded-xl border border-slate-200 p-1">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
              activeTab === "profile"
                ? "bg-blue-600 text-white shadow-md"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab("peoples")}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
              activeTab === "peoples"
                ? "bg-blue-600 text-white shadow-md"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Peoples
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "profile" && <ProfileTab centerId={centerId} />}
      {activeTab === "peoples" && <PeoplesTab centerId={centerId} />}
    </div>
  );
}

// Profile Tab Component
function ProfileTab({ centerId }: { centerId: string | null }) {
  const { data: centerData, loading, error } = useApi<Center>(
    centerId ? `/timetable/centers/${centerId}/` : ""
  );

  if (!centerId) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="text-center py-8">
          <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600">Loading center information...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading center details...</p>
        </div>
      </div>
    );
  }

  if (error || !centerData) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-6 h-6 text-red-600" />
          </div>
          <p className="text-red-600 mb-2">Failed to load center details</p>
          <p className="text-sm text-slate-500">{error || "Unknown error"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
          <Building2 className="w-8 h-8 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{centerData.name}</h2>
          {centerData.institute && (
            <p className="text-slate-500">{centerData.institute.name}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-500 block mb-1">Center Name</label>
            <p className="text-base text-slate-900 font-medium">{centerData.name}</p>
          </div>
          {centerData.city && (
            <div>
              <label className="text-sm font-medium text-slate-500 block mb-1">City</label>
              <p className="text-base text-slate-900">{centerData.city}</p>
            </div>
          )}
          {centerData.address && (
            <div>
              <label className="text-sm font-medium text-slate-500 block mb-1">Address</label>
              <p className="text-base text-slate-900">{centerData.address}</p>
            </div>
          )}
        </div>
        <div className="space-y-4">
          {centerData.institute && (
            <div>
              <label className="text-sm font-medium text-slate-500 block mb-1">Institute</label>
              <p className="text-base text-slate-900">{centerData.institute.name}</p>
            </div>
          )}
          {centerData.id && (
            <div>
              <label className="text-sm font-medium text-slate-500 block mb-1">Center ID</label>
              <p className="text-base text-slate-900 font-mono text-sm">{centerData.id}</p>
            </div>
          )}
          {centerData.created_at && (
            <div>
              <label className="text-sm font-medium text-slate-500 block mb-1">Created At</label>
              <p className="text-base text-slate-900">
                {new Date(centerData.created_at).toLocaleDateString()}
              </p>
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
  const [errorTeachers, setErrorTeachers] = useState<string | null>(null);
  const [errorAdmins, setErrorAdmins] = useState<string | null>(null);
  const [showCreateTeacherModal, setShowCreateTeacherModal] = useState(false);
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    const fetchUsers = async () => {
      if (!centerId) return;

      // Fetch Teachers
      setLoadingTeachers(true);
      setErrorTeachers(null);
      try {
        const teachersResponse = await api.get(`/timetable/centers/${centerId}/users/?role=teacher`);
        // Handle both paginated response (results) and direct array response
        const teachersData = teachersResponse.data?.results || teachersResponse.data || [];
        setTeachers(Array.isArray(teachersData) ? teachersData : []);
      } catch (err) {
        setErrorTeachers(err instanceof Error ? err.message : "Failed to fetch teachers");
        console.error("Error fetching teachers:", err);
        setTeachers([]);
      } finally {
        setLoadingTeachers(false);
      }

      // Fetch Admins
      setLoadingAdmins(true);
      setErrorAdmins(null);
      try {
        const adminsResponse = await api.get(`/timetable/centers/${centerId}/users/?role=ADMIN`);
        // Handle both paginated response (results) and direct array response
        const adminsData = adminsResponse.data?.results || adminsResponse.data || [];
        setAdmins(Array.isArray(adminsData) ? adminsData : []);
      } catch (err) {
        setErrorAdmins(err instanceof Error ? err.message : "Failed to fetch admins");
        console.error("Error fetching admins:", err);
        setAdmins([]);
      } finally {
        setLoadingAdmins(false);
      }
    };

    fetchUsers();
  }, [centerId, refetchTrigger]);

  const handleRefetch = () => {
    setRefetchTrigger(prev => prev + 1);
  };

  if (!centerId) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600">Loading center information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Teachers Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Teachers ({Array.isArray(teachers) ? teachers.length : 0})</h3>
          </div>
          <button
            onClick={() => setShowCreateTeacherModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Teacher
          </button>
        </div>

        {loadingTeachers ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
            <p className="text-sm text-slate-500">Loading teachers...</p>
          </div>
        ) : errorTeachers ? (
          <div className="text-center py-8">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <X className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-sm text-red-600">{errorTeachers}</p>
          </div>
        ) : !Array.isArray(teachers) || teachers.length === 0 ? (
          <div className="text-center py-8">
            <User className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No teachers found in this center</p>
          </div>
        ) : (
          <div className="space-y-3">
            {Array.isArray(teachers) && teachers.map((teacher) => (
              <div
                key={teacher.id}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">
                      {teacher.full_name || `${teacher.first_name || ""} ${teacher.last_name || ""}`.trim() || teacher.username}
                    </p>
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      <span>{teacher.email}</span>
                      {teacher.teacher_code && (
                        <>
                          <span>•</span>
                          <span>Code: {teacher.teacher_code}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded">
                  Teacher
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Admins Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Admins ({Array.isArray(admins) ? admins.length : 0})</h3>
          </div>
          {isSuperAdmin && (
            <button
              onClick={() => setShowCreateAdminModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              Create Admin
            </button>
          )}
        </div>

        {loadingAdmins ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-slate-500">Loading admins...</p>
          </div>
        ) : errorAdmins ? (
          <div className="text-center py-8">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <X className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-sm text-red-600">{errorAdmins}</p>
          </div>
        ) : !Array.isArray(admins) || admins.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No admins found in this center</p>
          </div>
        ) : (
          <div className="space-y-3">
            {Array.isArray(admins) && admins.map((admin) => (
              <div
                key={admin.id}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Shield className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">
                      {admin.full_name || `${admin.first_name || ""} ${admin.last_name || ""}`.trim() || admin.username}
                    </p>
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      <span>{admin.email}</span>
                      {admin.phone && (
                        <>
                          <span>•</span>
                          <span>{admin.phone}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                  Admin
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Teacher Modal */}
      {showCreateTeacherModal && (
        <CreateTeacherModal
          centerId={centerId}
          onClose={() => setShowCreateTeacherModal(false)}
          onSuccess={() => {
            setShowCreateTeacherModal(false);
            handleRefetch();
          }}
        />
      )}

      {/* Create Admin Modal */}
      {showCreateAdminModal && isSuperAdmin && (
        <CreateAdminModal
          centerId={centerId}
          onClose={() => setShowCreateAdminModal(false)}
          onSuccess={() => {
            setShowCreateAdminModal(false);
            handleRefetch();
          }}
        />
      )}
    </div>
  );
}

// Create Teacher Modal Component
function CreateTeacherModal({
  centerId,
  onClose,
  onSuccess,
}: {
  centerId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone_number: '',
    employee_id: '',
    subjects: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [createdUser, setCreatedUser] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!centerId) {
      setError('Center ID is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload: any = {
        name: formData.name,
        email: formData.email,
        phone_number: formData.phone_number,
      };
      if (formData.employee_id) {
        payload.employee_id = formData.employee_id;
      }
      if (formData.subjects) {
        payload.subjects = formData.subjects;
      }

      const response = await api.post('/timetable/admin/teachers/create/', payload);
      setCreatedUser(response.data);
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to create teacher');
      console.error('Error creating teacher:', err);
    } finally {
      setLoading(false);
    }
  };

  if (success && createdUser) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />
          <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <div className="bg-white px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Teacher Created Successfully</h3>
            </div>
            <div className="bg-white px-6 py-6">
              <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-800 font-medium mb-2">Teacher has been created successfully!</p>
                {createdUser.username && (
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Username:</span> {createdUser.username}</p>
                    {createdUser.password && (
                      <p><span className="font-medium">Password:</span> {createdUser.password}</p>
                    )}
                    {createdUser.teacher_code && (
                      <p><span className="font-medium">Teacher Code:</span> {createdUser.teacher_code}</p>
                    )}
                  </div>
                )}
              </div>
              <div className="flex justify-end">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />
        <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Create Teacher</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-500">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-6 py-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Teacher Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="teacher@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="9876543212"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Employee ID (Optional)</label>
                <input
                  type="text"
                  value={formData.employee_id}
                  onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="EMP-001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Subjects (Optional)</label>
                <input
                  type="text"
                  value={formData.subjects}
                  onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Physics, Chemistry"
                />
              </div>
            </div>
            <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Teacher'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Create Admin Modal Component
function CreateAdminModal({
  centerId,
  onClose,
  onSuccess,
}: {
  centerId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone_number: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [createdUser, setCreatedUser] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!centerId) {
      setError('Center ID is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        center_id: centerId,
        name: formData.name,
        email: formData.email,
        phone_number: formData.phone_number,
      };

      const response = await api.post('/timetable/superadmin/admins/create/', payload);
      setCreatedUser(response.data);
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to create admin');
      console.error('Error creating admin:', err);
    } finally {
      setLoading(false);
    }
  };

  if (success && createdUser) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />
          <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <div className="bg-white px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Admin Created Successfully</h3>
            </div>
            <div className="bg-white px-6 py-6">
              <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-800 font-medium mb-2">Admin has been created successfully!</p>
                {createdUser.username && (
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Username:</span> {createdUser.username}</p>
                    {createdUser.password && (
                      <p><span className="font-medium">Password:</span> {createdUser.password}</p>
                    )}
                  </div>
                )}
              </div>
              <div className="flex justify-end">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />
        <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Create Admin</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-500">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-6 py-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Admin Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="admin@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="9876543211"
                />
              </div>
            </div>
            <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Admin'}
              </button>
            </div>
          </form>
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

