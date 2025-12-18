import { useState, useEffect, useRef } from "react";
import {
  Building2,
  FileText,
  Settings,
  Home,
  Users,
  GraduationCap,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  X,
  MoreVertical,
  MapPin,
  Menu,
  ChevronLeft,
  Zap,
} from "lucide-react";
import { useAuthContext } from "../contexts/AuthContext";

type SidebarTab = "home" | "exams" | "settings";
type HomeSubTab = "centers" | "programs" | "peoples";

interface Center {
  id: number;
  name: string;
  code: string;
  city: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  admins: number;
  teachers: number;
  staff: number;
  students: number;
  status: "active" | "inactive";
}

interface Program {
  id: number;
  name: string;
  type: string;
  centers: string[];
  batches: number;
  students: number;
  status: "active" | "inactive";
}

interface Person {
  id: number;
  name: string;
  email: string;
  role: string;
  center: string;
  status: "active" | "inactive";
}

const mockCenters: Center[] = [
  {
    id: 1,
    name: "Delhi Main Center",
    code: "DEL-MAIN",
    city: "New Delhi",
    address: "123 Education Street, Delhi 110001",
    contactEmail: "delhi@institute.com",
    contactPhone: "+91-11-12345678",
    website: "https://delhi.institute.com",
    admins: 2,
    teachers: 18,
    staff: 6,
    students: 320,
    status: "active",
  },
  {
    id: 2,
    name: "Kota Residential",
    code: "KOT-RES",
    city: "Kota",
    address: "456 Study Lane, Kota 324005",
    contactEmail: "kota@institute.com",
    contactPhone: "+91-744-9876543",
    website: "https://kota.institute.com",
    admins: 1,
    teachers: 24,
    staff: 10,
    students: 540,
    status: "active",
  },
];

const mockPrograms: Program[] = [
  {
    id: 1,
    name: "Super 30 – JEE Advanced",
    type: "Flagship",
    centers: ["Delhi Main Center", "Kota Residential"],
    batches: 2,
    students: 58,
    status: "active",
  },
  {
    id: 2,
    name: "OnlyBoard – CBSE 12th",
    type: "Board Focused",
    centers: ["Delhi Main Center"],
    batches: 2,
    students: 85,
    status: "active",
  },
];

const mockPeoples: Person[] = [
  {
    id: 1,
    name: "John Doe",
    email: "john@institute.com",
    role: "institute_admin",
    center: "Delhi Main Center",
    status: "active",
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane@institute.com",
    role: "teacher",
    center: "Kota Residential",
    status: "active",
  },
];

export default function SuperAdminDashboard() {
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("home");
  const [homeSubTab, setHomeSubTab] = useState<HomeSubTab>("centers");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuthContext();

  // Modal states
  const [showAddCenterModal, setShowAddCenterModal] = useState(false);
  const [showEditCenterModal, setShowEditCenterModal] = useState(false);
  const [showViewCenterModal, setShowViewCenterModal] = useState(false);
  const [showDeleteCenterModal, setShowDeleteCenterModal] = useState(false);
  const [selectedCenter, setSelectedCenter] = useState<Center | null>(null);

  const [showAddProgramModal, setShowAddProgramModal] = useState(false);
  const [showAddPersonModal, setShowAddPersonModal] = useState(false);

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
                  <p className="text-xs text-slate-500 whitespace-nowrap">Super Admin</p>
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
              icon={Settings}
              label="Settings"
              active={sidebarTab === "settings"}
              onClick={() => setSidebarTab("settings")}
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
                  {sidebarTab === "settings" && "Settings"}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-900">{user?.get_full_name || user?.email}</p>
                <p className="text-xs text-slate-500">Super Admin</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-blue-600 to-violet-600 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
            </div>
          </header>

          {/* Content Area */}
          <main className="flex-1 overflow-y-auto p-6">
            {sidebarTab === "home" && (
              <HomeTab
                activeSubTab={homeSubTab}
                onSubTabChange={setHomeSubTab}
                onAddCenter={() => setShowAddCenterModal(true)}
                onEditCenter={(center) => {
                  setSelectedCenter(center);
                  setShowEditCenterModal(true);
                }}
                onViewCenter={(center) => {
                  setSelectedCenter(center);
                  setShowViewCenterModal(true);
                }}
                onDeleteCenter={(center) => {
                  setSelectedCenter(center);
                  setShowDeleteCenterModal(true);
                }}
                onAddProgram={() => setShowAddProgramModal(true)}
                onAddPerson={() => setShowAddPersonModal(true)}
              />
            )}
            {sidebarTab === "exams" && <ExamsTab />}
            {sidebarTab === "settings" && <SettingsTab />}
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
                  icon={Settings}
                  label="Settings"
                  active={sidebarTab === "settings"}
                  onClick={() => {
                    setSidebarTab("settings");
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
      {showAddCenterModal && <AddCenterModal onClose={() => setShowAddCenterModal(false)} />}
      {showEditCenterModal && selectedCenter && (
        <EditCenterModal center={selectedCenter} onClose={() => setShowEditCenterModal(false)} />
      )}
      {showViewCenterModal && selectedCenter && (
        <ViewCenterModal center={selectedCenter} onClose={() => setShowViewCenterModal(false)} />
      )}
      {showDeleteCenterModal && selectedCenter && (
        <DeleteCenterModal center={selectedCenter} onClose={() => setShowDeleteCenterModal(false)} />
      )}
      {showAddProgramModal && <AddProgramModal onClose={() => setShowAddProgramModal(false)} />}
      {showAddPersonModal && <AddPersonModal onClose={() => setShowAddPersonModal(false)} />}
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
function HomeTab({
  activeSubTab,
  onSubTabChange,
  onAddCenter,
  onEditCenter,
  onViewCenter,
  onDeleteCenter,
  onAddProgram,
  onAddPerson,
}: {
  activeSubTab: HomeSubTab;
  onSubTabChange: (tab: HomeSubTab) => void;
  onAddCenter: () => void;
  onEditCenter: (center: Center) => void;
  onViewCenter: (center: Center) => void;
  onDeleteCenter: (center: Center) => void;
  onAddProgram: () => void;
  onAddPerson: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Sub Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => onSubTabChange("centers")}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeSubTab === "centers"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            Centers
          </button>
          <button
            onClick={() => onSubTabChange("programs")}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeSubTab === "programs"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            Programs
          </button>
          <button
            onClick={() => onSubTabChange("peoples")}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeSubTab === "peoples"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            Peoples
          </button>
        </nav>
      </div>

      {/* Sub Tab Content */}
      {activeSubTab === "centers" && (
        <CentersSubTab
          onAdd={onAddCenter}
          onEdit={onEditCenter}
          onView={onViewCenter}
          onDelete={onDeleteCenter}
        />
      )}
      {activeSubTab === "programs" && <ProgramsSubTab onAdd={onAddProgram} />}
      {activeSubTab === "peoples" && <PeoplesSubTab onAdd={onAddPerson} />}
    </div>
  );
}

// Centers Sub Tab
function CentersSubTab({
  onAdd,
  onEdit,
  onView,
  onDelete,
}: {
  onAdd: () => void;
  onEdit: (center: Center) => void;
  onView: (center: Center) => void;
  onDelete: (center: Center) => void;
}) {
  const [centers] = useState<Center[]>(mockCenters);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCenters = centers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search centers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={onAdd}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-500/25"
        >
          <Plus className="w-4 h-4" />
          Add Center
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCenters.map((center) => (
          <CenterCard
            key={center.id}
            center={center}
            onEdit={() => onEdit(center)}
            onView={() => onView(center)}
            onDelete={() => onDelete(center)}
          />
        ))}
      </div>
    </div>
  );
}

// Center Card
function CenterCard({
  center,
  onEdit,
  onView,
  onDelete,
}: {
  center: Center;
  onEdit: () => void;
  onView: () => void;
  onDelete: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{center.name}</h3>
            <p className="text-sm text-slate-500">{center.code}</p>
          </div>
        </div>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 hover:bg-slate-100 rounded"
          >
            <MoreVertical className="w-5 h-5 text-slate-400" />
          </button>
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-10">
              <button
                onClick={() => {
                  onView();
                  setShowMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                View
              </button>
              <button
                onClick={() => {
                  onEdit();
                  setShowMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => {
                  onDelete();
                  setShowMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <MapPin className="w-4 h-4" />
          <span>{center.city}</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-500">Admins</p>
            <p className="text-sm font-semibold text-slate-900">{center.admins}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Teachers</p>
            <p className="text-sm font-semibold text-slate-900">{center.teachers}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Staff</p>
            <p className="text-sm font-semibold text-slate-900">{center.staff}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Students</p>
            <p className="text-sm font-semibold text-slate-900">{center.students}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <span
          className={`px-2 py-1 text-xs font-medium rounded ${
            center.status === "active"
              ? "bg-green-100 text-green-700"
              : "bg-slate-100 text-slate-700"
          }`}
        >
          {center.status}
        </span>
        <button
          onClick={onView}
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          View Details →
        </button>
      </div>
    </div>
  );
}

// Programs Sub Tab
function ProgramsSubTab({ onAdd }: { onAdd: () => void }) {
  const [programs] = useState<Program[]>(mockPrograms);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Programs</h2>
        <button
          onClick={onAdd}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-500/25"
        >
          <Plus className="w-4 h-4" />
          Add Program
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {programs.map((program) => (
          <div
            key={program.id}
            className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-all"
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900">{program.name}</h3>
                <p className="text-sm text-slate-500">{program.type}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Batches</span>
                <span className="font-medium text-slate-900">{program.batches}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Students</span>
                <span className="font-medium text-slate-900">{program.students}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Peoples Sub Tab
function PeoplesSubTab({ onAdd }: { onAdd: () => void }) {
  const [peoples] = useState<Person[]>(mockPeoples);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Peoples</h2>
        <button
          onClick={onAdd}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-500/25"
        >
          <Plus className="w-4 h-4" />
          Add Person
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Center</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {peoples.map((person) => (
              <tr key={person.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 text-sm font-medium text-slate-900">{person.name}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{person.email}</td>
                <td className="px-6 py-4 text-sm text-slate-600 capitalize">{person.role.replace("_", " ")}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{person.center}</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${
                      person.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {person.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Exams Tab
function ExamsTab() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Exams Management</h2>
        <p className="text-slate-600">Exam management interface will be implemented here</p>
      </div>
    </div>
  );
}

// Settings Tab
function SettingsTab() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Settings</h2>
        <p className="text-slate-600">System settings will be implemented here</p>
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

function AddCenterModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal isOpen={true} onClose={onClose} title="Add Center">
      <p className="text-slate-600">Add center form will be implemented here</p>
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
          Create
        </button>
      </div>
    </Modal>
  );
}

function EditCenterModal({ center, onClose }: { center: Center; onClose: () => void }) {
  return (
    <Modal isOpen={true} onClose={onClose} title="Edit Center">
      <p className="text-slate-600">Edit center form for {center.name} will be implemented here</p>
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
          Save Changes
        </button>
      </div>
    </Modal>
  );
}

function ViewCenterModal({ center, onClose }: { center: Center; onClose: () => void }) {
  return (
    <Modal isOpen={true} onClose={onClose} title="Center Details">
      <div className="space-y-4">
        <div>
          <p className="text-sm text-slate-500">Name</p>
          <p className="text-base font-medium text-slate-900">{center.name}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Code</p>
          <p className="text-base font-medium text-slate-900">{center.code}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">City</p>
          <p className="text-base font-medium text-slate-900">{center.city}</p>
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}

function DeleteCenterModal({ center, onClose }: { center: Center; onClose: () => void }) {
  return (
    <Modal isOpen={true} onClose={onClose} title="Delete Center">
      <p className="text-slate-600">
        Are you sure you want to delete <strong>{center.name}</strong>? This action cannot be undone.
      </p>
      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
        >
          Delete
        </button>
      </div>
    </Modal>
  );
}

function AddProgramModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal isOpen={true} onClose={onClose} title="Add Program">
      <p className="text-slate-600">Add program form will be implemented here</p>
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
          Create
        </button>
      </div>
    </Modal>
  );
}

function AddPersonModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal isOpen={true} onClose={onClose} title="Add Person">
      <p className="text-slate-600">Add person form will be implemented here</p>
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
          Create
        </button>
      </div>
    </Modal>
  );
}
